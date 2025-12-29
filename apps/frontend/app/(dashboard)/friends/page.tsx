'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
    useFriends,
    usePendingRequests,
    useSentRequests,
    useBlockedUsers,
    useAcceptFriendRequest,
    useRejectFriendRequest,
    useCancelFriendRequest,
    useRemoveFriend,
    useUnblockUser,
    useSendFriendRequest,
} from '@/features/friends/hooks/useFriends';
import { useSearchUsers } from '@/features/profile/hooks/useProfile';
import { useMe } from '@/features/auth/hook/useAuth';

type Tab = 'friends' | 'requests' | 'blocked';

// Friend card component
const FriendCard = ({
    id,
    username,
    avatar,
    isOnline,
    onRemove,
    isRemoving,
}: {
    id: number;
    username: string;
    avatar: string | null;
    isOnline: boolean;
    onRemove: () => void;
    isRemoving: boolean;
}) => (
    <div className="flex items-center justify-between rounded-xl border bg-card p-4">
        <Link href={`/profile/${id}`} className="flex items-center gap-3">
            <div className="relative">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500">
                    {avatar ? (
                        <img src={avatar} alt={username} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                            {username.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card bg-emerald-500" />
                )}
            </div>
            <div>
                <div className="font-medium">{username}</div>
                <div className="text-xs text-muted-foreground">
                    {isOnline ? (
                        <span className="text-emerald-500">Online</span>
                    ) : (
                        'Offline'
                    )}
                </div>
            </div>
        </Link>
        <div className="flex items-center gap-2">
            {isOnline && (
                <Link href="/play">
                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                        Challenge
                    </Button>
                </Link>
            )}
            <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                disabled={isRemoving}
                className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
            >
                Remove
            </Button>
        </div>
    </div>
);

// Request card component
const RequestCard = ({
    id,
    username,
    avatar,
    type,
    onAccept,
    onReject,
    onCancel,
    isPending,
}: {
    id: number;
    username: string;
    avatar: string | null;
    type: 'received' | 'sent';
    onAccept?: () => void;
    onReject?: () => void;
    onCancel?: () => void;
    isPending: boolean;
}) => (
    <div className="flex items-center justify-between rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500">
                {avatar ? (
                    <img src={avatar} alt={username} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                        {username.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <div>
                <div className="font-medium">{username}</div>
                <div className="text-xs text-muted-foreground">
                    {type === 'received' ? 'Wants to be your friend' : 'Request pending'}
                </div>
            </div>
        </div>
        <div className="flex items-center gap-2">
            {type === 'received' ? (
                <>
                    <Button
                        size="sm"
                        onClick={onAccept}
                        disabled={isPending}
                        className="bg-emerald-500 hover:bg-emerald-600"
                    >
                        Accept
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onReject}
                        disabled={isPending}
                        className="text-red-500 hover:bg-red-500/10 hover:text-red-500"
                    >
                        Decline
                    </Button>
                </>
            ) : (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isPending}
                    className="text-muted-foreground hover:text-foreground"
                >
                    Cancel
                </Button>
            )}
        </div>
    </div>
);

// Blocked user card
const BlockedCard = ({
    id,
    username,
    avatar,
    onUnblock,
    isPending,
}: {
    id: number;
    username: string;
    avatar: string | null;
    onUnblock: () => void;
    isPending: boolean;
}) => (
    <div className="flex items-center justify-between rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-700">
                {avatar ? (
                    <img
                        src={avatar}
                        alt={username}
                        className="h-full w-full object-cover opacity-50 grayscale"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-500">
                        {username.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <div>
                <div className="font-medium text-slate-400">{username}</div>
                <div className="text-xs text-red-500">Blocked</div>
            </div>
        </div>
        <Button size="sm" variant="outline" onClick={onUnblock} disabled={isPending}>
            Unblock
        </Button>
    </div>
);

// Search result card with status awareness
const SearchResultCard = ({
    id,
    username,
    avatar,
    isOnline,
    status,
    onAddFriend,
    isPending,
}: {
    id: number;
    username: string;
    avatar: string | null;
    isOnline: boolean;
    status: 'none' | 'friend' | 'request_sent' | 'request_received';
    onAddFriend: () => void;
    isPending: boolean;
}) => (
    <div className="flex items-center justify-between rounded-xl border bg-card p-4">
        <Link href={`/profile/${id}`} className="flex items-center gap-3">
            <div className="relative">
                <div className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500">
                    {avatar ? (
                        <img src={avatar} alt={username} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center font-bold text-white">
                            {username.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-emerald-500" />
                )}
            </div>
            <span className="font-medium">{username}</span>
        </Link>
        {status === 'none' && (
            <Button
                size="sm"
                onClick={onAddFriend}
                disabled={isPending}
                className="bg-emerald-500 hover:bg-emerald-600"
            >
                {isPending ? 'Sending...' : 'Add Friend'}
            </Button>
        )}
        {status === 'friend' && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Friends
            </span>
        )}
        {status === 'request_sent' && (
            <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-medium text-slate-400">
                Request Sent
            </span>
        )}
        {status === 'request_received' && (
            <Button
                size="sm"
                onClick={onAddFriend}
                disabled={isPending}
                className="bg-emerald-500 hover:bg-emerald-600"
            >
                Accept
            </Button>
        )}
    </div>
);

export default function FriendsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('friends');
    const [searchQuery, setSearchQuery] = useState('');

    // Get current user
    const { data: me } = useMe();

    // Data fetching
    const { data: friends = [], isLoading: friendsLoading } = useFriends();
    const { data: pendingRequests = [], isLoading: requestsLoading } = usePendingRequests();
    const { data: sentRequests = [], isLoading: sentLoading } = useSentRequests();
    const { data: blockedUsers = [], isLoading: blockedLoading } = useBlockedUsers();
    const { data: searchResults = [], isLoading: searchLoading } = useSearchUsers(searchQuery);

    // Mutations
    const acceptRequest = useAcceptFriendRequest();
    const rejectRequest = useRejectFriendRequest();
    const cancelRequest = useCancelFriendRequest();
    const removeFriend = useRemoveFriend();
    const unblockUser = useUnblockUser();
    const sendRequest = useSendFriendRequest();

    // Create sets for quick lookup
    const friendIds = useMemo(() => new Set(friends.map((f: any) => f.id)), [friends]);
    const sentRequestIds = useMemo(() => new Set(sentRequests.map((r: any) => r.receiver?.id)), [sentRequests]);
    const receivedRequestIds = useMemo(() => new Set(pendingRequests.map((r: any) => r.sender?.id)), [pendingRequests]);

    // Filter and enhance search results with relationship status
    const enhancedSearchResults = useMemo(() => {
        return searchResults
            .filter((user: any) => user.id !== me?.id) // Exclude self
            .map((user: any) => ({
                ...user,
                relationStatus: friendIds.has(user.id)
                    ? 'friend'
                    : sentRequestIds.has(user.id)
                        ? 'request_sent'
                        : receivedRequestIds.has(user.id)
                            ? 'request_received'
                            : 'none',
            }));
    }, [searchResults, me?.id, friendIds, sentRequestIds, receivedRequestIds]);

    const tabs = [
        { id: 'friends' as Tab, label: 'Friends', count: friends.length },
        {
            id: 'requests' as Tab,
            label: 'Requests',
            count: pendingRequests.length + sentRequests.length,
        },
        { id: 'blocked' as Tab, label: 'Blocked', count: blockedUsers.length },
    ];

    const onlineFriends = friends.filter((f: any) => f.isOnline);

    return (
        <div className="mx-auto max-w-4xl px-4 py-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold sm:text-3xl">Friends</h1>
                <p className="mt-1 text-muted-foreground">
                    Manage your friends, requests, and blocked users
                </p>
            </div>

            {/* Search */}
            <div className="mb-6">
                <div className="relative">
                    <svg
                        className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <Input
                        type="text"
                        placeholder="Search for players to add..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-12 pl-10"
                    />
                </div>

                {/* Search Results */}
                {searchQuery.length >= 2 && (
                    <div className="mt-4 space-y-2">
                        {searchLoading ? (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                Searching...
                            </div>
                        ) : enhancedSearchResults.length > 0 ? (
                            <>
                                <p className="mb-2 text-sm text-muted-foreground">
                                    Found {enhancedSearchResults.length} players
                                </p>
                                {enhancedSearchResults.map((user: any) => (
                                    <SearchResultCard
                                        key={user.id}
                                        id={user.id}
                                        username={user.username}
                                        avatar={user.avatar}
                                        isOnline={user.isOnline}
                                        status={user.relationStatus}
                                        onAddFriend={() => sendRequest.mutate(user.id)}
                                        isPending={sendRequest.isPending}
                                    />
                                ))}
                            </>
                        ) : (
                            <div className="py-8 text-center text-sm text-muted-foreground">
                                No players found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-1 rounded-xl border bg-muted p-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors',
                            activeTab === tab.id
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span
                                className={cn(
                                    'rounded-full px-2 py-0.5 text-xs',
                                    activeTab === tab.id
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : 'bg-muted-foreground/10'
                                )}
                            >
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="space-y-3">
                {/* Friends Tab */}
                {activeTab === 'friends' && (
                    <>
                        {friendsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : friends.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                    <svg
                                        className="h-8 w-8 text-muted-foreground"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="mb-1 font-semibold">No friends yet</h3>
                                <p className="text-sm text-muted-foreground">
                                    Search for players above to add them as friends
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Online friends first */}
                                {onlineFriends.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="mb-2 text-sm font-medium text-emerald-500">
                                            Online — {onlineFriends.length}
                                        </h3>
                                        <div className="space-y-2">
                                            {onlineFriends.map((friend: any) => (
                                                <FriendCard
                                                    key={friend.id}
                                                    id={friend.id}
                                                    username={friend.username}
                                                    avatar={friend.avatar}
                                                    isOnline={true}
                                                    onRemove={() => removeFriend.mutate(friend.id)}
                                                    isRemoving={removeFriend.isPending}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Offline friends */}
                                {friends.filter((f: any) => !f.isOnline).length > 0 && (
                                    <div>
                                        <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                                            Offline — {friends.filter((f: any) => !f.isOnline).length}
                                        </h3>
                                        <div className="space-y-2">
                                            {friends
                                                .filter((f: any) => !f.isOnline)
                                                .map((friend: any) => (
                                                    <FriendCard
                                                        key={friend.id}
                                                        id={friend.id}
                                                        username={friend.username}
                                                        avatar={friend.avatar}
                                                        isOnline={false}
                                                        onRemove={() => removeFriend.mutate(friend.id)}
                                                        isRemoving={removeFriend.isPending}
                                                    />
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* Requests Tab */}
                {activeTab === 'requests' && (
                    <>
                        {requestsLoading || sentLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : pendingRequests.length === 0 && sentRequests.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                    <svg
                                        className="h-8 w-8 text-muted-foreground"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="mb-1 font-semibold">No pending requests</h3>
                                <p className="text-sm text-muted-foreground">
                                    Friend requests you send or receive will appear here
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Received requests */}
                                {pendingRequests.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="mb-2 text-sm font-medium text-emerald-500">
                                            Received — {pendingRequests.length}
                                        </h3>
                                        <div className="space-y-2">
                                            {pendingRequests.map((request: any, index: number) => {
                                                console.log("request", request);
                                                return (
                                                    <RequestCard
                                                        key={`${request.requestId}-${index}`}
                                                        id={request.sender.id}
                                                        username={request.sender.username}
                                                        avatar={request.sender.avatar}
                                                        type="received"
                                                        onAccept={() => acceptRequest.mutate(request.requestId)}
                                                        onReject={() => rejectRequest.mutate(request.requestId)}
                                                        isPending={
                                                            acceptRequest.isPending || rejectRequest.isPending
                                                        }
                                                    />
                                                )
                                            }
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Sent requests */}
                                {sentRequests.length > 0 && (
                                    <div>
                                        <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                                            Sent — {sentRequests.length}
                                        </h3>
                                        <div className="space-y-2">
                                            {sentRequests.map((request: any, index: number) => {
                                                console.log("sent request", request);
                                                return (
                                                    <RequestCard
                                                        key={`${request.requestId}-${index}`}
                                                        id={request.receiver.id}
                                                        username={request.receiver.username}
                                                        avatar={request.receiver.avatar}
                                                        type="sent"
                                                        onCancel={() => cancelRequest.mutate(request.requestId)}
                                                        isPending={cancelRequest.isPending}
                                                    />
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* Blocked Tab */}
                {activeTab === 'blocked' && (
                    <>
                        {blockedLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : blockedUsers.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                    <svg
                                        className="h-8 w-8 text-muted-foreground"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                        />
                                    </svg>
                                </div>
                                <h3 className="mb-1 font-semibold">No blocked users</h3>
                                <p className="text-sm text-muted-foreground">
                                    Users you block will appear here
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {blockedUsers.map((user: any) => (
                                    <BlockedCard
                                        key={user.id}
                                        id={user.userId}
                                        username={user.username}
                                        avatar={user.avatar}
                                        onUnblock={() => unblockUser.mutate(user.userId)}
                                        isPending={unblockUser.isPending}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
