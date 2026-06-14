import { pgTable, unique, uuid, text, timestamp } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	clerk_id: text("clerk_id").notNull(),
	email: text("email").notNull(),
	full_name: text("full_name"),
	role: text("role").default('tenant'),
	phone_number: text("phone_number"),
	created_at: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		users_clerk_id_unique: unique("users_clerk_id_unique").on(table.clerk_id),
	}
});