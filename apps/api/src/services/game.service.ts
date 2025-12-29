// backend/src/services/game.service.ts
import { db } from '../config/database';
import { eq } from 'drizzle-orm';
import { Game as ChessGame } from '../chess/game';
import { Player } from '../chess/player';
import { Move } from '../chess/move';
import { Color } from 'types/chess';
import { games } from 'schema/game.schema';
import { redis } from 'db/redis';
import { TIME_CONTROLS, type TimeControl } from '../utils/timeControl';
import { ratingService } from './rating.service';
import { profileService } from './profile.service';
import { Chess } from 'chess.js';

type GameResult = 'white_wins' | 'black_wins' | 'draw';

interface MakeMoveInput {
    gameId: string;
    userId: string;
    from: string;
    to: string;
    promotion?: string;
}

interface StoredMove {
    from: string;
    to: string;
    san: string;
    promotion?: string | undefined;
}

export class GameService {
    private gameKey(gameId: string) {
        return `game:${gameId}`;
    }

    async getGameRow(gameId: string) {
        const game = await db.query.games.findFirst({
            where: eq(games.id, Number(gameId))
        });
        if (!game) throw new Error('Game not found');
        return game;
    }

    async createInitialState(gameId: number) {
        const gameRow = await this.getGameRow(gameId.toString());

        const whitePlayer = new Player(
            gameRow.whitePlayerId.toString(),
            'white',
            Color.WHITE
        );
        const blackPlayer = new Player(
            gameRow.blackPlayerId.toString(),
            'black',
            Color.BLACK
        );

        const game = new ChessGame(whitePlayer, blackPlayer);
        const fen = game.getBoardFen();

        const tc = gameRow.timeControl as TimeControl;
        const config = TIME_CONTROLS[tc] ?? TIME_CONTROLS.blitz;

        const key = this.gameKey(gameId.toString());
        await redis.hset(key, {
            fen,
            status: 'active',
            'clock:white': config.initialMs.toString(),
            'clock:black': config.initialMs.toString(),
            'clock:increment': config.incrementMs.toString(),
            'clock:lastMoveAt': Date.now().toString(),
            'clock:activeColor': 'white'
        });
        await redis.expire(key, 60 * 60 * 6);
    }

    private async loadGameObject(gameId: string): Promise<{
        gameRow: any;
        game: ChessGame;
        currentFen: string;
    }> {
        const gameRow = await this.getGameRow(gameId);
        const key = this.gameKey(gameId);
        const fen = (await redis.hget(key, 'fen')) || undefined;

        const whitePlayer = new Player(
            gameRow.whitePlayerId.toString(),
            'white',
            Color.WHITE
        );
        const blackPlayer = new Player(
            gameRow.blackPlayerId.toString(),
            'black',
            Color.BLACK
        );

        const game = fen
            ? ChessGame.fromFen(whitePlayer, blackPlayer, fen)
            : new ChessGame(whitePlayer, blackPlayer);

        return { gameRow, game, currentFen: game.getBoardFen() };
    }

    private moveHistoryKey(gameId: string) {
        return `moves:${gameId}`;
    }

    private async addMoveToHistory(gameId: string, move: StoredMove): Promise<void> {
        const key = this.moveHistoryKey(gameId);
        await redis.rpush(key, JSON.stringify(move));
        await redis.expire(key, 60 * 60 * 6);
    }

    async getMoveHistory(gameId: string): Promise<StoredMove[]> {
        const key = this.moveHistoryKey(gameId);
        const moves = await redis.lrange(key, 0, -1);
        return moves.map(m => JSON.parse(m));
    }

    private async saveFen(gameId: string, fen: string) {
        await redis.hset(this.gameKey(gameId), { fen });
    }

    async makeMove(input: MakeMoveInput) {
        const { gameRow, game } = await this.loadGameObject(input.gameId);

        const isWhite = Number(input.userId) === Number(gameRow.whitePlayerId);
        const isBlack = Number(input.userId) === Number(gameRow.blackPlayerId);

        if (!isWhite && !isBlack) throw new Error('Not a player in this game');

        const expectedColor = isWhite ? Color.WHITE : Color.BLACK;
        if (game.getCurrentTurn() !== expectedColor) {
            throw new Error('Not your turn, its ' + game.getCurrentTurn() + "'s turn");
        }

        // --- CLOCK UPDATE ---
        const clocks = await this.getClocks(input.gameId);
        const now = Date.now();
        const elapsed = Math.max(0, now - clocks.lastMoveAt);

        let whiteMs = clocks.whiteMs;
        let blackMs = clocks.blackMs;

        if (expectedColor === Color.WHITE) {
            whiteMs = whiteMs - elapsed + clocks.incrementMs;
        } else {
            blackMs = blackMs - elapsed + clocks.incrementMs;
        }

        if (whiteMs <= 0 || blackMs <= 0) {
            const flagColor = whiteMs <= 0 ? 'white' : 'black';
            const result: GameResult = flagColor === 'white' ? 'black_wins' : 'white_wins';
            const resultReason = 'timeout';

            await db
                .update(games)
                .set({
                    status: 'completed',
                    result,
                    resultReason,
                    endedAt: new Date()
                })
                .where(eq(games.id, Number(input.gameId)));

            await redis.hset(this.gameKey(input.gameId), {
                status: 'completed',
                result,
                resultReason,
                'clock:white': whiteMs.toString(),
                'clock:black': blackMs.toString()
            });

            return {
                fen: game.getBoardFen(),
                move: null,
                gameOver: true,
                result,
                resultReason,
                clocks: {
                    white: whiteMs,
                    black: blackMs,
                    increment: clocks.incrementMs,
                    lastMoveAt: now,
                    activeColor: expectedColor === Color.WHITE ? 'black' : 'white'
                }
            };
        }
        // ---------------------

        // Use chess.js to compute SAN notation before making the move
        const currentFen = game.getBoardFen();
        const chessForSan = new Chess(currentFen);
        let san = '';
        try {
            const chessMove = chessForSan.move({
                from: input.from,
                to: input.to,
                promotion: input.promotion as any
            });
            if (chessMove) {
                san = chessMove.san;
            }
        } catch (e) {
            // Fall through to let the game validate
        }

        const move = new Move(input.from, input.to, input.promotion);
        const ok = game.playMove(move);
        if (!ok) throw new Error('Illegal move');

        const fen = game.getBoardFen();

        // Store move with SAN in history
        await this.addMoveToHistory(input.gameId, {
            from: input.from,
            to: input.to,
            san,
            promotion: input.promotion
        });

        // Next side to move
        const nextColor: 'white' | 'black' =
            expectedColor === Color.WHITE ? 'black' : 'white';

        await this.saveFen(input.gameId, fen);
        await this.saveClocks(input.gameId, {
            whiteMs,
            blackMs,
            incrementMs: clocks.incrementMs,
            lastMoveAt: now,
            activeColor: nextColor
        });

        let result: GameResult | null = null;
        let resultReason: string | null = null;

        if (game.isOver()) {
            const winner = game.getWinner();
            if (winner === Color.WHITE) result = 'white_wins';
            else if (winner === Color.BLACK) result = 'black_wins';
            else result = 'draw';
            resultReason = result === 'draw' ? 'draw' : 'checkmate';

            await db
                .update(games)
                .set({
                    status: 'completed',
                    result,
                    resultReason,
                    endedAt: new Date()
                })
                .where(eq(games.id, Number(input.gameId)));

            if (result) {
                await ratingService.updateRatingsForGame(input.gameId);
            }

            await redis.hset(this.gameKey(input.gameId), {
                status: 'completed',
                result,
                resultReason
            });
        }

        return {
            fen,
            move: { from: input.from, to: input.to, san, promotion: input.promotion },
            gameOver: !!result,
            result,
            resultReason,
            clocks: {
                white: whiteMs,
                black: blackMs,
                increment: clocks.incrementMs,
                lastMoveAt: now,
                activeColor: nextColor
            }
        };
    }

    async getLegalMoves(
        gameId: string,
        userId: string,
        from?: string
    ) {
        const { gameRow, game } = await this.loadGameObject(gameId);

        const isWhite = Number(userId) === Number(gameRow.whitePlayerId);
        const isBlack = Number(userId) === Number(gameRow.blackPlayerId);

        if (!isWhite && !isBlack) {
            throw new Error('Not a player in this game');
        }

        // Optional: only allow hints on your own turn
        // const expectedColor = isWhite ? Color.WHITE : Color.BLACK;
        // if (game.getCurrentTurn() !== expectedColor) {
        //   throw new Error('Not your turn');
        // }

        const moves = game.getLegalMoves(from);
        return moves;
    }

    async resign(gameId: string, userId: string) {
        const gameRow = await this.getGameRow(gameId);

        let result: GameResult;
        if (userId === gameRow.whitePlayerId.toString()) result = 'black_wins';
        else if (userId === gameRow.blackPlayerId.toString()) result = 'white_wins';
        else throw new Error('Not a player in this game');

        await db
            .update(games)
            .set({
                status: 'completed',
                result,
                resultReason: 'resign',
                endedAt: new Date()
            })
            .where(eq(games.id, Number(gameId)));

        await redis.hset(this.gameKey(gameId), {
            status: 'completed',
            result,
            resultReason: 'resign'
        });

        await ratingService.updateRatingsForGame(gameId);

        return { result, resultReason: 'resign' };
    }

    async endGameAsDraw(gameId: string) {
        const gameRow = await this.getGameRow(gameId);

        if (gameRow.status !== 'active') {
            throw new Error('Game is not active');
        }

        const result: GameResult = 'draw';

        await db
            .update(games)
            .set({
                status: 'completed',
                result,
                resultReason: 'agreement',
                endedAt: new Date()
            })
            .where(eq(games.id, Number(gameId)));

        await redis.hset(this.gameKey(gameId), {
            status: 'completed',
            result,
            resultReason: 'agreement'
        });

        await ratingService.updateRatingsForGame(gameId);

        return { result, resultReason: 'agreement' };
    }

    private async getClocks(gameId: string) {
        const key = this.gameKey(gameId);
        const [
            whiteStr,
            blackStr,
            incStr,
            lastStr,
            activeColor
        ] = await redis.hmget(
            key,
            'clock:white',
            'clock:black',
            'clock:increment',
            'clock:lastMoveAt',
            'clock:activeColor'
        );

        return {
            whiteMs: Number(whiteStr ?? 0),
            blackMs: Number(blackStr ?? 0),
            incrementMs: Number(incStr ?? 0),
            lastMoveAt: Number(lastStr ?? 0),
            activeColor: (activeColor as 'white' | 'black') ?? 'white'
        };
    }

    private async saveClocks(
        gameId: string,
        clocks: {
            whiteMs: number;
            blackMs: number;
            incrementMs: number;
            lastMoveAt: number;
            activeColor: 'white' | 'black';
        }
    ) {
        const key = this.gameKey(gameId);
        await redis.hset(key, {
            'clock:white': clocks.whiteMs.toString(),
            'clock:black': clocks.blackMs.toString(),
            'clock:increment': clocks.incrementMs.toString(),
            'clock:lastMoveAt': clocks.lastMoveAt.toString(),
            'clock:activeColor': clocks.activeColor
        });
    }

    async getClockState(gameId: string) {
        const clocks = await this.getClocks(gameId);
        return {
            white: clocks.whiteMs,
            black: clocks.blackMs,
            increment: clocks.incrementMs,
            lastMoveAt: clocks.lastMoveAt,
            activeColor: clocks.activeColor
        };
    }

    async getFen(gameId: string): Promise<string | null> {
        const key = this.gameKey(gameId);
        const fen = await redis.hget(key, 'fen');
        return fen || null;
    }

    // Check if Redis has live game data
    async hasLiveGameData(gameId: string): Promise<boolean> {
        const key = this.gameKey(gameId);
        const exists = await redis.exists(key);
        return exists === 1;
    }

    async getFullState(gameId: string) {
        const gameRow = await this.getGameRow(gameId);

        // Check if game has live data in Redis
        const hasLiveData = await this.hasLiveGameData(gameId);

        // For completed games without live data, return limited info
        if (!hasLiveData && gameRow.status === 'completed') {
            // Fetch player profiles
            const [whiteProfile, blackProfile] = await Promise.all([
                profileService.getProfile(gameRow.whitePlayerId.toString()),
                profileService.getProfile(gameRow.blackPlayerId.toString())
            ]);

            const whiteRating = whiteProfile.ratings?.find(
                (r: any) => r.timeControl === gameRow.timeControl
            );
            const blackRating = blackProfile.ratings?.find(
                (r: any) => r.timeControl === gameRow.timeControl
            );

            return {
                gameId,
                fen: gameRow.initialFen === 'startpos'
                    ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
                    : gameRow.initialFen,
                clocks: { white: 0, black: 0, increment: 0, lastMoveAt: 0, activeColor: 'white' as const },
                moveHistory: [], // Move history expired
                whitePlayerId: gameRow.whitePlayerId,
                blackPlayerId: gameRow.blackPlayerId,
                whiteUsername: whiteProfile.username,
                blackUsername: blackProfile.username,
                whiteRating: whiteRating?.rating ?? 1200,
                blackRating: blackRating?.rating ?? 1200,
                whiteAvatarUrl: whiteProfile.avatar_url,
                blackAvatarUrl: blackProfile.avatar_url,
                timeControl: gameRow.timeControl,
                status: gameRow.status,
                result: gameRow.result,
                resultReason: gameRow.resultReason,
                isExpired: true // Flag to indicate game data has expired
            };
        }

        // For active games or completed games with live data
        const fen = await this.getFen(gameId) || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
        const clocks = await this.getClockState(gameId);
        const moveHistory = await this.getMoveHistory(gameId);

        // Fetch player profiles (with caching via profileService)
        const [whiteProfile, blackProfile] = await Promise.all([
            profileService.getProfile(gameRow.whitePlayerId.toString()),
            profileService.getProfile(gameRow.blackPlayerId.toString())
        ]);

        // Get player ratings for the game's time control
        const whiteRating = whiteProfile.ratings?.find(
            (r: any) => r.timeControl === gameRow.timeControl
        );
        const blackRating = blackProfile.ratings?.find(
            (r: any) => r.timeControl === gameRow.timeControl
        );

        return {
            gameId,
            fen,
            clocks,
            moveHistory,
            whitePlayerId: gameRow.whitePlayerId,
            blackPlayerId: gameRow.blackPlayerId,
            whiteUsername: whiteProfile.username,
            blackUsername: blackProfile.username,
            whiteRating: whiteRating?.rating ?? 1200,
            blackRating: blackRating?.rating ?? 1200,
            whiteAvatarUrl: whiteProfile.avatar_url,
            blackAvatarUrl: blackProfile.avatar_url,
            timeControl: gameRow.timeControl,
            status: gameRow.status,
            result: gameRow.result,
            resultReason: gameRow.resultReason,
            isExpired: false
        };
    }

    // Get static game details (for REST API - doesn't include dynamic state)
    async getGameDetails(gameId: string) {
        const gameRow = await this.getGameRow(gameId);

        // Fetch player profiles
        const [whiteProfile, blackProfile] = await Promise.all([
            profileService.getProfile(gameRow.whitePlayerId.toString()),
            profileService.getProfile(gameRow.blackPlayerId.toString())
        ]);

        const whiteRating = whiteProfile.ratings?.find(
            (r: any) => r.timeControl === gameRow.timeControl
        );
        const blackRating = blackProfile.ratings?.find(
            (r: any) => r.timeControl === gameRow.timeControl
        );

        return {
            gameId,
            timeControl: gameRow.timeControl,
            mode: gameRow.mode,
            startedAt: gameRow.startedAt,
            whitePlayer: {
                id: gameRow.whitePlayerId,
                username: whiteProfile.username,
                rating: whiteRating?.rating ?? 1200,
                avatarUrl: whiteProfile.avatar_url,
                country: whiteProfile.profile.country
            },
            blackPlayer: {
                id: gameRow.blackPlayerId,
                username: blackProfile.username,
                rating: blackRating?.rating ?? 1200,
                avatarUrl: blackProfile.avatar_url,
                country: blackProfile.country
            }
        };
    }
}

export const gameService = new GameService();
