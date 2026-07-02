import { pgTable, uuid, integer, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { leases } from "./leases";

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Link directly to the lease (which inherently links to the tenant and property)
  leaseId: uuid("lease_id").references(() => leases.id).notNull(),
  
  // Financial Details
  amountPaid: integer("amount_paid").notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  
  // Payment Method & Tracking (Crucial for the Kenyan context)
  paymentMethod: varchar("payment_method", { enum: ["m-pesa", "bank_transfer", "cash"] }).default("m-pesa").notNull(),
  referenceNumber: varchar("reference_number"), // e.g., M-Pesa transaction code (QEX1234567)
  
  // For partial payments or overpayments
  notes: text("notes"), 
  
  // Lifecycle
  status: varchar("status", { enum: ["pending", "completed", "failed", "refunded"] }).default("completed").notNull(),
  
  createdAt: timestamp("created_at").defaultNow(),
});