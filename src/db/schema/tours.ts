import { pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { properties } from "./properties";
import { users } from "./users";

export const tourRequests = pgTable("tour_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Relational Links
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }).notNull(),
  landlordId: uuid("landlord_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  
  // 🔥 NEW: Link the tour request directly to the tenant's user account
  tenantId: uuid("tenant_id").references(() => users.id, { onDelete: "cascade" }),
  
  // Tenant Contact Info
  tenantName: varchar("tenant_name", { length: 255 }).notNull(),
  tenantEmail: varchar("tenant_email", { length: 255 }).notNull(),
  tenantPhone: varchar("tenant_phone", { length: 20 }).notNull(),
  
  // Tour Details
  tourDate: timestamp("tour_date").notNull(),
  message: text("message"), // Optional note from the tenant
  
  // State Management
  status: varchar("status", { enum: ["pending", "approved", "declined", "completed"] }).default("pending").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});