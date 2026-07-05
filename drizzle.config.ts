import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Tell Drizzle to explicitly load variables from .env.local
config({ path: ".env.local" }); 

export default defineConfig({
  schema: "./src/db/schema/*", // Verify this path matches where your schemas are!
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!, // This will now successfully find your Neon URL
  },
});