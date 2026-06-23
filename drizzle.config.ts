import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema/*", 
  dialect: "postgresql",
  dbCredentials: {
    // UPDATED: Now Drizzle uses the direct line!
    url: process.env.DIRECT_URL!,
  },
});