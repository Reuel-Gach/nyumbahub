import { pgTable, text, timestamp, uuid, integer, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  landlordId: uuid("landlord_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  
  // The column to store our Cloud Image Link
  imageUrl: text("image_url"), 
  
  pricePerMonth: integer("price_per_month").notNull(),
  location: text("location").notNull(),
  
  // UPGRADED: Replaced 'isAvailable' boolean with a robust SaaS lifecycle status
  status: varchar("status", { enum: ["vacant", "active_listing", "occupied"] }).default("active_listing").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});