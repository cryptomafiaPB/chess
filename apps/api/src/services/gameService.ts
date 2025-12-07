import { Chess } from "chess.js";
import { gameRepository } from "../repositories/gameRepository";

export class GameService {

    async joinGame(gameId: string, playerId: string) {
        const gameData = await gameRepository.getGame(gameId);

        // 1. Game doesn't exist? Create it.
        if (!gameData) {
            const chess = new Chess();
            await gameRepository.createGame(gameId, chess.fen(), playerId);
            return { result: "CREATED", color: "w", fen: chess.fen() };
        }

        // 2. Reconnecting? 
        if (gameData.whitePlayerId === playerId) return { result: "RECONNECTED", color: "w", fen: gameData.fen };
        if (gameData.blackPlayerId === playerId) return { result: "RECONNECTED", color: "b", fen: gameData.fen };

        // 3. Game waiting for opponent?
        if (!gameData.blackPlayerId) {
            await gameRepository.addBlackPlayer(gameId, playerId);
            return { result: "JOINED", color: "b", fen: gameData.fen };
        }

        // 4. Spectator
        return { result: "SPECTATOR", color: "s", fen: gameData.fen };
    }

    async makeMove(gameId: string, playerId: string, move: { from: string, to: string, promotion?: string }) {
        // 1. Fetch State
        const gameData = await gameRepository.getGame(gameId);
        if (!gameData) throw new Error("Game not found");

        // 2. Validate Player Turn
        const chess = new Chess(gameData.fen);
        const turnColor = chess.turn(); // 'w' or 'b'

        const isWhite = gameData.whitePlayerId === playerId;
        const isBlack = gameData.blackPlayerId === playerId;

        if ((turnColor === 'w' && !isWhite) || (turnColor === 'b' && !isBlack)) {
            throw new Error("Not your turn");
        }

        // 3. Validate Move Logic
        try {
            const newMove = chess.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
            if (!newMove) throw new Error("Invalid move");
        } catch (e) {
            throw new Error("Invalid move");
        }

        // 4. Save New State
        await gameRepository.updateGameState(gameId, chess.fen());
        await gameRepository.addMoveToHistory(gameId, move); // Can store SAN or full move obj

        return {
            success: true,
            fen: chess.fen(),
            turn: chess.turn() // Return who plays next
        };
    }
}

export const gameService = new GameService();