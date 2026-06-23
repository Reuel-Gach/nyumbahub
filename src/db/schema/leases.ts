import { pgTable, uuid, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { users } from "./users";
import { properties } from "./properties";

export const leases = pgTable("leases", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // The core relationships
  propertyId: uuid("property_id").references(() => properties.id).notNull(),
  tenantId: uuid("tenant_id").references(() => users.id).notNull(),
  landlordId: uuid("landlord_id").references(() => users.id).notNull(),
  
  // Financial terms
  rentAmount: integer("rent_amount").notNull(),
  billingCycle: varchar("billing_cycle", { enum: ["monthly", "quarterly", "yearly"] }).default("monthly").notNull(),
  
  // Lifecycle of the lease
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"), // Nullable in case it's a month-to-month open-ended lease
  status: varchar("status", { enum: ["active", "terminated", "pending"] }).default("active").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});