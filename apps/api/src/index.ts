import express from "express";
import { users } from "./schema/user.schema";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { createServer } from "http";
import { setupSocket } from "socket";
import { Color } from "types/chess";
import { Player } from "chess/player";
import { Game } from "chess/game";

dotenv.config({ path: ".env" });

const app = express();

const server = createServer(app);


const playerW = new Player("1", "Alice", Color.WHITE);
const playerB = new Player("2", "Bob", Color.BLACK);
const chessGame = new Game(playerW, playerB);


setupSocket(server, chessGame);


if (!process.env.TEST) {
    console.log("no TEST env var set, loading .env file");
}

if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL environment variable");
    process.exit(1);
}


const db = drizzle(process.env.DATABASE_URL!);



app.use(express.urlencoded({ extended: true }));

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Welcome to the Chess Webapp API");
});

app.get("/users", async (req, res) => {
    const allUsers = await db.select().from(users);
    res.json(allUsers);
});

app.post("/users", async (req, res) => {
    console.log("POST /users body:", req.body);
    const { username, email, password, bio } = req.body;
    try {
        // Hash the password
        const hashed_password = bcrypt.hashSync(password, 10);
        const newUser = await db.insert(users).values({ username, hashed_password, email, bio }).returning();
        res.status(201).json(newUser);
    } catch (err) {
        console.error("DB insert error:", err);
        res.status(500).json({ error: "Failed to create user", detail: String(err) });
    }
});

server.listen(8000, () => {
    console.log("Server running on port 8000");
});
