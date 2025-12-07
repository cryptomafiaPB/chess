import { gameService } from "services/gameService";
import { Server, Socket } from "socket.io";

export function setupSocket(io: Server) {

    io.on("connection", (socket: Socket) => {
        console.log(`User connected: ${socket.id}`);

        socket.on("join_game", async (data) => {
            const { gameId } = data;
            // Use socket.id as playerId for now (Production: use JWT user ID)
            const response = await gameService.joinGame(gameId, socket.id);

            socket.join(gameId);
            socket.emit("game_joined", response);

            if (response.result === "JOINED") {
                // Notify White that Black joined
                io.to(gameId).emit("opponent_joined", { message: "Game Started" });
            }
        });

        socket.on("move", async (data) => {
            const { gameId, from, to, promotion } = data;
            try {
                const result = await gameService.makeMove(gameId, socket.id, { from, to, promotion });

                // Broadcast to everyone in the room (including sender)
                io.to(gameId).emit("move_made", {
                    fen: result.fen,
                    from, to // helpful for frontend animations
                });
            } catch (error: any) {
                socket.emit("move_error", { message: error.message });
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected", socket.id);
            // Optional: Handle auto-resign or pause timers here
        });
    });
}