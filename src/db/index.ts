import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

// Global cache pattern prevents ETIMEDOUT errors
const globalForDb = globalThis as unknown as { db: any };
export const db = globalForDb.db || drizzle(sql);

if (process.env.NODE_ENV !== "production") {
  globalForDb.db = db;
}