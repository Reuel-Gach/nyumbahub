import { pgTable, uuid, integer, varchar, timestamp, text } from "drizzle-orm/pg-core";
import { leases } from "./leases";

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  
  // Link directly to the lease (which inherently links to the tenant and property)
  leaseId: uuid("lease_id").references(() => leases.id, { onDelete: "cascade" }).notNull(),
  
  // Financial Details
  amountPaid: integer("amount_paid").notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  
  // Payment Method & Tracking
  paymentMethod: varchar("payment_method", { enum: ["m-pesa", "bank_transfer", "cash"] }).default("m-pesa").notNull(),
  
  // NEW: M-Pesa Daraja Tracking Fields
  phoneNumber: varchar("phone_number", { length: 20 }), // The number the STK push was sent to
  checkoutRequestId: varchar("checkout_request_id", { length: 100 }).unique(), // Maps STK push to the Daraja Callback
  
  // e.g., M-Pesa transaction code (QEX1234567). Made unique to prevent duplicate receipts!
  referenceNumber: varchar("reference_number", { length: 50 }).unique(), 
  
  // For partial payments or overpayments
  notes: text("notes"), 
  
  // Lifecycle (Default changed to pending for Daraja STK Push flow)
  status: varchar("status", { enum: ["pending", "completed", "failed", "refunded"] }).default("pending").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(), // Important for tracking when the callback arrived
});