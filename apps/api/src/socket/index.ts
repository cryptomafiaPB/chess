import type { Game } from "chess/game";
import { Move } from "chess/move";
import { Server } from "socket.io";

export function setupSocket(server: any, gameInstance: Game) {
    const io = new Server(server, {
        cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
        socket.send("Welcome to the Chess Game Socket!");
        console.log("New client connected:", socket.id);
        console.log(socket.data);

        socket.on("ping", () => {
            console.log(`Received ping from ${socket.id}`);
            socket.emit("ping", { message: "pong" });
        });
        socket.on("join_game", () => {
            console.log(`Socket ${socket.id} joined the game`);
            // Assign player or spectator here
            socket.emit("init", {
                fen: gameInstance.getBoardFen(),
                moves: gameInstance.getMoveHistory()
            });
        });

        socket.on("move", (data) => {
            // sanitize / validate payload
            if (!data?.from || !data?.to) {
                console.warn(`Invalid move payload from ${socket.id}:`, data);
                socket.emit("move_error", { error: "Missing 'from' or 'to' in move payload" });
                return;
            }
            const move = new Move(data.from, data.to, data.promotion);
            console.log(`data received for move:`, data.from, data.to, data.promotion);
            try {
                const valid = gameInstance.playMove(move);
                if (!valid) {
                    socket.emit("move_error", { error: "Illegal move or wrong turn" });
                }
                io.emit("move_made", {
                    valid,
                    fen: gameInstance.getBoardFen(),
                    moves: gameInstance.getMoveHistory(),
                });
            } catch (e) {
                console.error(`Error while playing move from ${socket.id}:`, e, data);
                socket.emit("move_error", { error: String(e) });
            }
        });

        socket.on("disconnect", () => {
            // Handle player/spectator leaving
            io.emit("player_left", { socketId: socket.id });
            console.log("Client disconnected:", socket.id);
        });
    });
}
