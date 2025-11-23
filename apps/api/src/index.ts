import express from "express";
import { users } from "./schema/user.schema";
import { drizzle } from "drizzle-orm/node-postgres";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

if (!process.env.TEST) {
    console.log("no TEST env var set, loading .env file");
}

if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL environment variable");
    process.exit(1);
}


const db = drizzle(process.env.DATABASE_URL!);


const app = express();

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
    const { name, email, bio } = req.body;
    try {
        const newUser = await db.insert(users).values({ name, email, bio }).returning();
        res.status(201).json(newUser);
    } catch (err) {
        console.error("DB insert error:", err);
        res.status(500).json({ error: "Failed to create user", detail: String(err) });
    }
});

app.listen(8000, () => {
    console.log("Server running on port 8000");
});
