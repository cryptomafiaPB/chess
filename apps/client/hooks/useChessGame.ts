import { useEffect, useState, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { Socket } from "socket.io-client";
import { getUserId } from "@/utils/identity";
import { gameToBoard } from "@/utils/chessHelpers";

export const useChessGame = (socket: Socket | null, gameId: string) => {
    // 1. Core State (Source of Truth is usually Server, but we keep local for speed)
    const gameRef = useRef(new Chess());
    const [fen, setFen] = useState("start");
    const [history, setHistory] = useState<any[]>([]);

    // 2. Player State
    const [orientation, setOrientation] = useState<"white" | "black">("white");
    const [myColor, setMyColor] = useState<"w" | "b" | "s">("s"); // s = spectator
    const [isGameActive, setIsGameActive] = useState(false);

    // 3. Helper to update visual state from internal chess.js instance
    const updateState = useCallback(() => {
        setFen(gameRef.current.fen());
        setHistory(gameRef.current.history({ verbose: true }));
    }, []);

    // 4. Socket Event Listeners
    useEffect(() => {
        if (!socket) return;
        const userId = getUserId();

        // A. Join the game immediately
        socket.emit("join_game", { gameId, playerId: userId });

        // B. Handle Join Response
        socket.on("game_joined", (data: { color: "w" | "b" | "s", fen: string }) => {
            gameRef.current.load(data.fen);
            setMyColor(data.color);
            // Auto-rotate board for Black players
            setOrientation(data.color === "b" ? "black" : "white");
            updateState();
        });

        // C. Handle Opponent Moves
        socket.on("move_made", (data: { fen: string, from: string, to: string }) => {
            gameRef.current.load(data.fen); // Trust server state absolutely
            updateState();

            // Optional: Add sound effect here
            // new Audio('/move-self.mp3').play();
        });

        // D. Handle Game Start
        socket.on("game_start", (data: { fen: string }) => {
            gameRef.current.load(data.fen);
            setIsGameActive(true);
            updateState();
        });

        return () => {
            socket.off("game_joined");
            socket.off("move_made");
            socket.off("game_start");
        };
    }, [socket, gameId, updateState]);

    // 5. Action: Make a Move
    const makeMove = (from: string, to: string) => {
        if (!socket || !isGameActive && myColor !== 's') return; // Can't move if paused or spectator

        // Optimistic Update (Make it feel instant)
        try {
            const move = gameRef.current.move({ from, to, promotion: 'q' });
            if (!move) return; // Invalid move locally

            updateState(); // Re-render immediately

            // Send to server
            socket.emit("move", {
                gameId,
                from,
                to,
                promotion: 'q',
                playerId: getUserId()
            });

        } catch (e) {
            // Illegal move attempted
            return;
        }
    };

    return {
        fen,
        board: gameToBoard(gameRef.current), // You might need to handle orientation here or in UI
        history,
        orientation,
        status: { isGameActive, myColor },
        makeMove,
        gameInstance: gameRef.current
    };
};