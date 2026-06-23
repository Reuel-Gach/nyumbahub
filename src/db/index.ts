import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL!);

// Global cache pattern prevents ETIMEDOUT errors
const globalForDb = globalThis as unknown as { db: any };
export const db = globalForDb.db || drizzle(sql);

if  (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dns = require('node:dns');
    dns.setDefaultResultOrder('ipv4first');
  } catch (e) {
    console.error("DNS override failed", e);
  }
}