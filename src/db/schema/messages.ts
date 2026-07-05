import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { tourRequests } from "./tours";
import { users } from "./users";

export const tourMessages = pgTable("tour_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Link the message to a specific tour thread
  tourId: uuid("tour_id")
    .references(() => tourRequests.id, { onDelete: "cascade" })
    .notNull(),
    
  // Who sent it? (Could be the Tenant OR the Landlord)
  senderId: uuid("sender_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
    
  // The actual chat bubble content
  content: text("content").notNull(),

  isRead: boolean("is_read").default(false).notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});