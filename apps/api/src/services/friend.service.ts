import { eq, and, or, inArray, sql } from 'drizzle-orm';
import { db } from '../config/database';
import { redis } from '../db/redis';
import { users } from 'schema/user.schema';
import { friendships } from 'schema/friendship.schema';
import { friendRequests } from 'schema/friend-request.schema';
import { profiles } from 'schema/profile.shema';

export class FriendService {
    // Send friend request [web:47][web:49]
    async sendFriendRequest(senderId: string, receiverId: string) {
        if (senderId === receiverId) {
            throw new Error('Cannot send friend request to yourself');
        }

        // Check if users exist
        const receiver = await db.query.users.findFirst({
            where: eq(users.id, Number(receiverId))
        });

        if (!receiver) {
            throw new Error('User not found');
        }

        // Check if already friends
        const existingFriendship = await db.query.friendships.findFirst({
            where: and(
                eq(friendships.userId, Number(senderId)),
                eq(friendships.friendId, Number(receiverId))
            )
        });

        if (existingFriendship) {
            throw new Error('Already friends with this user');
        }

        // Check if request already exists
        const existingRequest = await db.query.friendRequests.findFirst({
            where: and(
                eq(friendRequests.senderId, Number(senderId)),
                eq(friendRequests.receiverId, Number(receiverId)),
                eq(friendRequests.status, 'pending')
            )
        });

        if (existingRequest) {
            throw new Error('Friend request already sent');
        }

        // Check if reverse request exists (they sent you a request)
        const reverseRequest = await db.query.friendRequests.findFirst({
            where: and(
                eq(friendRequests.senderId, Number(receiverId)),
                eq(friendRequests.receiverId, Number(senderId)),
                eq(friendRequests.status, 'pending')
            )
        });

        if (reverseRequest) {
            // Auto-accept and create friendship
            return this.acceptFriendRequest(senderId, String(reverseRequest.id));
        }

        // Create friend request
        const [request] = await db
            .insert(friendRequests)
            .values({
                senderId: Number(senderId),
                receiverId: Number(receiverId),
                status: 'pending'
            })
            .returning();

        // Send notification via Redis pub/sub
        await redis.publish('notifications', JSON.stringify({
            type: 'friend_request',
            receiverId,
            senderId,
            requestId: request!.id
        }));

        return request;
    }

    // Accept friend request
    async acceptFriendRequest(userId: string, requestId: string) {
        const request = await db.query.friendRequests.findFirst({
            where: eq(friendRequests.id, Number(requestId))
        });

        if (!request) {
            throw new Error('Friend request not found');
        }

        if (request.receiverId !== Number(userId)) {
            throw new Error('Not authorized to accept this request');
        }

        if (request.status !== 'pending') {
            throw new Error('Friend request already processed');
        }

        console.log('Accepting friend request:', request);
        // Update request status
        await db
            .update(friendRequests)
            .set({
                status: 'accepted',
                updatedAt: new Date()
            })
            .where(eq(friendRequests.id, Number(requestId)));

        console.log('Friend request status updated to accepted');
        // Create friendship records (double-row approach)
        await db.insert(friendships).values([
            {
                userId: request.senderId,
                friendId: request.receiverId,
                status: 'active'
            },
            {
                userId: request.receiverId,
                friendId: request.senderId,
                status: 'active'
            }
        ]);

        console.log('Friendship records created');
        // Invalidate friend lists cache
        await redis.del(`friends:${request.senderId}`);
        await redis.del(`friends:${request.receiverId}`);

        // Notify sender
        await redis.publish('notifications', JSON.stringify({
            type: 'friend_accepted',
            receiverId: request.senderId,
            accepterId: userId
        }));

        return { message: 'Friend request accepted' };
    }

    // Reject friend request [web:47]
    async rejectFriendRequest(userId: string, requestId: string) {
        const request = await db.query.friendRequests.findFirst({
            where: eq(friendRequests.id, Number(requestId))
        });

        if (!request) {
            throw new Error('Friend request not found');
        }

        if (request.receiverId !== Number(userId)) {
            throw new Error('Not authorized to reject this request');
        }

        await db
            .update(friendRequests)
            .set({
                status: 'rejected',
                updatedAt: new Date()
            })
            .where(eq(friendRequests.id, Number(requestId)));

        return { message: 'Friend request rejected' };
    }

    // Cancel friend request 
    async cancelFriendRequest(userId: string, requestId: string) {
        const request = await db.query.friendRequests.findFirst({
            where: eq(friendRequests.id, Number(requestId))
        });

        if (!request) {
            throw new Error('Friend request not found');
        }

        if (request.senderId !== Number(userId)) {
            throw new Error('Not authorized to cancel this request');
        }

        if (request.status !== 'pending') {
            throw new Error('Can only cancel pending requests');
        }

        await db
            .update(friendRequests)
            .set({
                status: 'cancelled',
                updatedAt: new Date()
            })
            .where(eq(friendRequests.id, Number(requestId)));

        return { message: 'Friend request cancelled' };
    }

    // Remove friend
    async removeFriend(userId: string, friendId: string) {
        // Delete both friendship records
        await db
            .delete(friendships)
            .where(
                or(
                    and(
                        eq(friendships.userId, Number(userId)),
                        eq(friendships.friendId, Number(friendId))
                    ),
                    and(
                        eq(friendships.userId, Number(friendId)),
                        eq(friendships.friendId, Number(userId))
                    )
                )
            );

        // Invalidate cache
        await redis.del(`friends:${userId}`);
        await redis.del(`friends:${friendId}`);

        return { message: 'Friend removed successfully' };
    }

    // Block user 
    async blockUser(userId: string, blockUserId: string) {
        // Remove existing friendship if any
        await this.removeFriend(userId, blockUserId);

        // Update or create friendship record with blocked status
        const existing = await db.query.friendships.findFirst({
            where: and(
                eq(friendships.userId, Number(userId)),
                eq(friendships.friendId, Number(blockUserId))
            )
        });

        if (existing) {
            await db
                .update(friendships)
                .set({ status: 'blocked' })
                .where(eq(friendships.id, existing.id));
        } else {
            await db.insert(friendships).values({
                userId: Number(userId),
                friendId: Number(blockUserId),
                status: 'blocked'
            });
        }

        // Reject any pending requests
        await db
            .update(friendRequests)
            .set({ status: 'rejected' })
            .where(
                or(
                    and(
                        eq(friendRequests.senderId, Number(blockUserId)),
                        eq(friendRequests.receiverId, Number(userId)),
                        eq(friendRequests.status, 'pending')
                    ),
                    and(
                        eq(friendRequests.senderId, Number(userId)),
                        eq(friendRequests.receiverId, Number(blockUserId)),
                        eq(friendRequests.status, 'pending')
                    )
                )
            );

        await redis.del(`friends:${userId}`);

        return { message: 'User blocked successfully' };
    }

    // Unblock user [web:47]
    async unblockUser(userId: string, unblockUserId: string) {
        await db
            .delete(friendships)
            .where(
                and(
                    eq(friendships.userId, Number(userId)),
                    eq(friendships.friendId, Number(unblockUserId)),
                    eq(friendships.status, 'blocked')
                )
            );

        await redis.del(`friends:${userId}`);

        return { message: 'User unblocked successfully' };
    }

    // Get friends list 
    async getFriends(userId: string) {
        const cacheKey = `friends:${userId}`;
        const cached = await redis.get(cacheKey);

        if (cached) {
            return JSON.parse(cached);
        }

        const friends = await db
            .select({
                id: users.id,
                username: users.username,
                avatar: users.avatar_url,
                isOnline: profiles.isOnline,
                friendshipId: friendships.id,
                friendsSince: friendships.createdAt
            })
            .from(friendships)
            .innerJoin(users, eq(friendships.friendId, users.id))
            .leftJoin(profiles, eq(users.id, profiles.userId))
            .where(
                and(
                    eq(friendships.userId, Number(userId)),
                    eq(friendships.status, 'active')
                )
            );

        // Cache for 5 minutes
        await redis.setex(cacheKey, 300, JSON.stringify(friends));

        return friends;
    }

    // Get pending friend requests (incoming)
    async getPendingRequests(userId: string) {
        const requests = await db
            .select({
                requestId: friendRequests.id,
                sender: {
                    id: users.id,
                    username: users.username,
                    avatar: users.avatar_url
                },
                createdAt: friendRequests.createdAt
            })
            .from(friendRequests)
            .innerJoin(users, eq(friendRequests.senderId, users.id))
            .where(
                and(
                    eq(friendRequests.receiverId, Number(userId)),
                    eq(friendRequests.status, 'pending')
                )
            );

        return requests;
    }

    // Get sent friend requests (outgoing)
    async getSentRequests(userId: string) {
        const requests = await db
            .select({
                requestId: friendRequests.id,
                receiver: {
                    id: users.id,
                    username: users.username,
                    avatar: users.avatar_url
                },
                createdAt: friendRequests.createdAt
            })
            .from(friendRequests)
            .innerJoin(users, eq(friendRequests.receiverId, users.id))
            .where(
                and(
                    eq(friendRequests.senderId, Number(userId)),
                    eq(friendRequests.status, 'pending')
                )
            );

        return requests;
    }

    // Get blocked users
    async getBlockedUsers(userId: string) {
        const blocked = await db
            .select({
                id: users.id,
                username: users.username,
                avatar: users.avatar_url,
                blockedAt: friendships.createdAt
            })
            .from(friendships)
            .innerJoin(users, eq(friendships.friendId, users.id))
            .where(
                and(
                    eq(friendships.userId, Number(userId)),
                    eq(friendships.status, 'blocked')
                )
            );

        return blocked;
    }

    // Check friendship status [web:47]
    async getFriendshipStatus(userId: string, targetUserId: string) {
        const friendship = await db.query.friendships.findFirst({
            where: and(
                eq(friendships.userId, Number(userId)),
                eq(friendships.friendId, Number(targetUserId))
            )
        });

        if (friendship) {
            return friendship.status; // 'active' or 'blocked'
        }

        // Check for pending requests
        const sentRequest = await db.query.friendRequests.findFirst({
            where: and(
                eq(friendRequests.senderId, Number(userId)),
                eq(friendRequests.receiverId, Number(targetUserId)),
                eq(friendRequests.status, 'pending')
            )
        });

        if (sentRequest) {
            return 'request_sent';
        }

        const receivedRequest = await db.query.friendRequests.findFirst({
            where: and(
                eq(friendRequests.senderId, Number(targetUserId)),
                eq(friendRequests.receiverId, Number(userId)),
                eq(friendRequests.status, 'pending')
            )
        });

        if (receivedRequest) {
            return 'request_received';
        }

        return 'none';
    }
}

export const friendService = new FriendService();
