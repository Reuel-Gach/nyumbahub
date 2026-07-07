import { pgTable, text, timestamp, uuid, integer, boolean, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  landlordId: uuid("landlord_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  
  // 🔥 NEW: Category & Sub-Type
  category: varchar("category", { length: 50 }).default("Residential").notNull(),
  subType: varchar("sub_type", { length: 50 }).notNull(),
  
  // The column to store our Cloud Image Link
  imageUrl: text("image_url"), 
  gallery: text("gallery").array(),
  
  pricePerMonth: integer("price_per_month").notNull(),
  location: text("location").notNull(),
  
  // Using boolean for stability
  isAvailable: boolean("is_available").default(true).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});