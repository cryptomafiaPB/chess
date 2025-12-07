import { drizzle } from "drizzle-orm/node-postgres";
import { config } from "./env";
import postgres from "postgres"
import * as schema from "../schema/index";

const client = postgres(config.databaseUrl);
export const db = drizzle(config.databaseUrl, schema);

