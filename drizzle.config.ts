import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  out: "./drizzle",
  // Use the wildcard (*) to read all schema files in the folder automatically
  schema: "./src/db/schema/*", 
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});