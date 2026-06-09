import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core"
import { organization } from "./auth"
import { leads } from "./leads"
import { relations } from "drizzle-orm"

export const activities = pgTable("activities", {
  id:             text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  leadId:         text("lead_id").references(() => leads.id, { onDelete: "cascade" }),
  userId:         text("user_id"), // agent who triggered it, null if AI

  type: text("type").notNull(),
  // lead_created, lead_updated, message_sent, message_received,
  // meeting_scheduled, meeting_completed, status_changed,
  // score_updated, note_added, call_completed

  description: text("description").notNull(),
  metadata:    jsonb("metadata").default({}),

  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export type Activity    = typeof activities.$inferSelect
export type NewActivity = typeof activities.$inferInsert

export const activitiesRelations = relations(activities, ({ one }) => ({
  organization: one(organization, { fields: [activities.organizationId], references: [organization.id] }),
  lead:         one(leads, { fields: [activities.leadId], references: [leads.id] }),
}))
