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

type GameResult = 'white_wins' | 'black_wins' | 'draw';

interface MakeMoveInput {
    gameId: string;
    userId: string;
    from: string;
    to: string;
    promotion?: string;
}

export class GameService {
    private gameKey(gameId: string) {
        return `game:${gameId}`;
    }

    async getGameRow(gameId: string) {
        const game = await db.query.games.findFirst({
            where: eq(games.id, gameId)
        });
        if (!game) throw new Error('Game not found');
        return game;
    }

    async createInitialState(gameId: string) {
        const gameRow = await this.getGameRow(gameId);

        const whitePlayer = new Player(
            gameRow.whitePlayerId,
            'white',
            Color.WHITE
        );
        const blackPlayer = new Player(
            gameRow.blackPlayerId,
            'black',
            Color.BLACK
        );

        const game = new ChessGame(whitePlayer, blackPlayer);
        const fen = game.getBoardFen();

        const tc = gameRow.timeControl as TimeControl;
        const config = TIME_CONTROLS[tc] ?? TIME_CONTROLS.blitz;

        const key = this.gameKey(gameId);
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
            gameRow.whitePlayerId,
            'white',
            Color.WHITE
        );
        const blackPlayer = new Player(
            gameRow.blackPlayerId,
            'black',
            Color.BLACK
        );

        const game = fen
            ? ChessGame.fromFen(whitePlayer, blackPlayer, fen)
            : new ChessGame(whitePlayer, blackPlayer);

        return { gameRow, game, currentFen: game.getBoardFen() };
    }

    private async saveFen(gameId: string, fen: string) {
        await redis.hset(this.gameKey(gameId), { fen });
    }

    async makeMove(input: MakeMoveInput) {
        const { gameRow, game } = await this.loadGameObject(input.gameId);

        const isWhite = input.userId === gameRow.whitePlayerId;
        const isBlack = input.userId === gameRow.blackPlayerId;
        if (!isWhite && !isBlack) throw new Error('Not a player in this game');

        const expectedColor = isWhite ? Color.WHITE : Color.BLACK;
        if (game.getCurrentTurn() !== expectedColor) {
            throw new Error('Not your turn');
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
                .where(eq(games.id, input.gameId));

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
                clocks: { white: whiteMs, black: blackMs }
            };
        }
        // ---------------------

        const move = new Move(input.from, input.to, input.promotion);
        const ok = game.playMove(move);
        if (!ok) throw new Error('Illegal move');

        const fen = game.getBoardFen();

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
                .where(eq(games.id, input.gameId));

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
            move: { from: input.from, to: input.to, promotion: input.promotion },
            gameOver: !!result,
            result,
            resultReason,
            clocks: { white: whiteMs, black: blackMs }
        };
    }

    async getLegalMoves(
        gameId: string,
        userId: string,
        from?: string
    ) {
        const { gameRow, game } = await this.loadGameObject(gameId);

        const isWhite = userId === gameRow.whitePlayerId;
        const isBlack = userId === gameRow.blackPlayerId;

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
        if (userId === gameRow.whitePlayerId) result = 'black_wins';
        else if (userId === gameRow.blackPlayerId) result = 'white_wins';
        else throw new Error('Not a player in this game');

        await db
            .update(games)
            .set({
                status: 'completed',
                result,
                resultReason: 'resign',
                endedAt: new Date()
            })
            .where(eq(games.id, gameId));

        await redis.hset(this.gameKey(gameId), {
            status: 'completed',
            result,
            resultReason: 'resign'
        });

        await ratingService.updateRatingsForGame(gameId);

        return { result, resultReason: 'resign' };
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
            activeColor: clocks.activeColor
        };
    }

    async getFen(gameId: string): Promise<string> {
        const key = this.gameKey(gameId);
        const fen = await redis.hget(key, 'fen');
        if (!fen) {
            const { game } = await this.loadGameObject(gameId);
            return game.getBoardFen();
        }
        return fen;
    }

    async getFullState(gameId: string) {
        const gameRow = await this.getGameRow(gameId);
        const fen = await this.getFen(gameId);
        const clocks = await this.getClockState(gameId);

        return {
            gameId,
            fen,
            clocks,
            whitePlayerId: gameRow.whitePlayerId,
            blackPlayerId: gameRow.blackPlayerId,
            status: gameRow.status,
            result: gameRow.result,
            resultReason: gameRow.resultReason
        };
    }
}

export const gameService = new GameService();
