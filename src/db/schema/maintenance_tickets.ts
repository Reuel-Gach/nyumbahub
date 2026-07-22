import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { properties } from "./properties";
import { users } from "./users";

export const maintenanceTickets = pgTable('maintenance_tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  propertyId: uuid('property_id').references(() => properties.id).notNull(),
  tenantId: uuid('tenant_id').references(() => users.id).notNull(),
  title: varchar('title').notNull(),
  description: text('description').notNull(),
  status: varchar('status').default('open').notNull(), // 'open', 'in_progress', 'resolved'
  priority: varchar('priority').default('medium').notNull(), // 'low', 'medium', 'high', 'emergency'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});