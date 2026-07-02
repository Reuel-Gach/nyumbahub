import { pgTable, text, timestamp, uuid, integer, boolean } from "drizzle-orm/pg-core";
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
  
  // REVERTED: Using boolean for stability
  isAvailable: boolean("is_available").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});