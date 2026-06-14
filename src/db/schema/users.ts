import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").notNull().unique(), // THIS IS CRITICAL
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").default("landlord"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});