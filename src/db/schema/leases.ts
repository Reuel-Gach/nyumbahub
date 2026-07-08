import { pgTable, uuid, varchar, timestamp, integer, text } from "drizzle-orm/pg-core";
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
  
  // 🔥 NEW: Explicit Lease Duration string for Kenyan legal contracts
  leaseDuration: varchar("lease_duration", { length: 100 }),
  
  // Lifecycle of the lease
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"), // Nullable in case it's a month-to-month open-ended lease
  
  // UPDATED: Added transition states for move-out and eviction
  status: varchar("status", { 
    enum: ["active", "pending", "move_out_pending", "eviction_notice", "early_termination_offered", "terminated", "ended", "cancelled"] 
  }).default("active").notNull(),
  
  // NEW: Termination and Eviction Tracking (Kenyan Law Compliance)
  terminationNoticeDate: timestamp("termination_notice_date"), // When the notice was given
  moveOutDate: timestamp("move_out_date"), // The legal +30 days date
  terminationInitiator: varchar("termination_initiator", { enum: ["tenant", "landlord"] }),
  terminationReason: text("termination_reason"), // Reason for eviction or move-out
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});