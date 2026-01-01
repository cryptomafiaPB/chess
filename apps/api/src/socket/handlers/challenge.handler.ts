import { Server, Socket } from 'socket.io';
import { challengeService } from '../../services/challenge.service';
import { profileService } from '../../services/profile.service';

type TimeControl = 'bullet' | 'blitz' | 'rapid' | 'classical';

interface ChallengePayload {
    challengedId: string;
    timeControl: TimeControl;
}

interface ChallengeResponsePayload {
    challengeId: string;
}

export function challengeHandler(io: Server, socket: Socket) {
    const userId = socket.data.userId as string | undefined;

    // Send a challenge to a friend
    socket.on('challenge:send', async (payload: ChallengePayload) => {
        try {
            if (!userId) {
                socket.emit('challenge:error', { message: 'Not authenticated' });
                return;
            }

            const challenge = await challengeService.createChallenge(
                userId,
                payload.challengedId,
                payload.timeControl
            );

            // Get the challenger's username
            let challengerUsername: string | undefined;
            try {
                const challengerProfile = await profileService.getProfile(userId);
                challengerUsername = challengerProfile?.username;
            } catch (e) {
                console.warn('Could not fetch challenger username:', e);
            }

            // Confirm to challenger
            socket.emit('challenge:sent', {
                challengeId: challenge.challengeId,
                challengedId: payload.challengedId,
                timeControl: payload.timeControl,
                expiresAt: challenge.expiresAt
            });

            // Notify the challenged user with challenger's username
            io.to(`user:${payload.challengedId}`).emit('challenge:received', {
                challengeId: challenge.challengeId,
                challengerId: userId,
                challengerUsername,
                timeControl: payload.timeControl,
                expiresAt: challenge.expiresAt
            });

            console.log(`⚔️ Challenge sent from ${userId} (${challengerUsername}) to ${payload.challengedId}`);
        } catch (err) {
            console.error('Challenge send error:', err);
            socket.emit('challenge:error', {
                message: err instanceof Error ? err.message : 'Failed to send challenge'
            });
        }
    });

    // Accept a challenge
    socket.on('challenge:accept', async (payload: ChallengeResponsePayload) => {
        try {
            if (!userId) {
                socket.emit('challenge:error', { message: 'Not authenticated' });
                return;
            }

            const challenge = await challengeService.getChallenge(payload.challengeId);
            if (!challenge) {
                socket.emit('challenge:error', { message: 'Challenge not found or expired' });
                return;
            }

            const result = await challengeService.acceptChallenge(payload.challengeId, userId);

            // Notify both players
            socket.emit('challenge:accepted', {
                challengeId: payload.challengeId,
                gameId: result.gameId
            });

            io.to(`user:${challenge.challengerId}`).emit('challenge:accepted', {
                challengeId: payload.challengeId,
                gameId: result.gameId
            });

            console.log(`✅ Challenge ${payload.challengeId} accepted, game created: ${result.gameId}`);
        } catch (err) {
            console.error('Challenge accept error:', err);
            socket.emit('challenge:error', {
                message: err instanceof Error ? err.message : 'Failed to accept challenge'
            });
        }
    });

    // Decline a challenge
    socket.on('challenge:decline', async (payload: ChallengeResponsePayload) => {
        try {
            if (!userId) {
                socket.emit('challenge:error', { message: 'Not authenticated' });
                return;
            }

            const challenge = await challengeService.getChallenge(payload.challengeId);
            if (!challenge) {
                socket.emit('challenge:error', { message: 'Challenge not found or expired' });
                return;
            }

            await challengeService.declineChallenge(payload.challengeId, userId);

            // Notify both players
            socket.emit('challenge:declined', {
                challengeId: payload.challengeId,
                declinedBy: userId
            });

            io.to(`user:${challenge.challengerId}`).emit('challenge:declined', {
                challengeId: payload.challengeId,
                declinedBy: userId
            });

            console.log(`❌ Challenge ${payload.challengeId} declined by ${userId}`);
        } catch (err) {
            console.error('Challenge decline error:', err);
            socket.emit('challenge:error', {
                message: err instanceof Error ? err.message : 'Failed to decline challenge'
            });
        }
    });

    // Cancel a sent challenge
    socket.on('challenge:cancel', async (payload: ChallengeResponsePayload) => {
        try {
            if (!userId) {
                socket.emit('challenge:error', { message: 'Not authenticated' });
                return;
            }

            const challenge = await challengeService.getChallenge(payload.challengeId);
            if (!challenge) {
                socket.emit('challenge:error', { message: 'Challenge not found or expired' });
                return;
            }

            await challengeService.cancelChallenge(payload.challengeId, userId);

            // Notify both players
            socket.emit('challenge:cancelled', {
                challengeId: payload.challengeId
            });

            io.to(`user:${challenge.challengedId}`).emit('challenge:cancelled', {
                challengeId: payload.challengeId,
                cancelledBy: userId
            });

            console.log(`🚫 Challenge ${payload.challengeId} cancelled by ${userId}`);
        } catch (err) {
            console.error('Challenge cancel error:', err);
            socket.emit('challenge:error', {
                message: err instanceof Error ? err.message : 'Failed to cancel challenge'
            });
        }
    });
}
