import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "./env";

export const db = drizzle(config.databaseUrl);

