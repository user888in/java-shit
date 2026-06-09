import { pgTable, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core"
import { organization } from "./auth"
import { leads } from "./leads"
import { relations } from "drizzle-orm"


export const meetings = pgTable("meetings", {
  id:             text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  leadId:         text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),
  assignedTo:     text("assigned_to"), // agent user id

  type:     text("type").notNull(), // call, video_call, site_visit, office_visit
  status:   text("status").notNull().default("scheduled"), // scheduled, completed, cancelled, no_show
  title:    text("title"),
  notes:    text("notes"),

  scheduledAt:  timestamp("scheduled_at").notNull(),
  completedAt:  timestamp("completed_at"),
  duration:     text("duration"), // "30min", "1hour"

  // cal.com booking reference
  calBookingId:  text("cal_booking_id"),
  calBookingUrl: text("cal_booking_url"),

  // site visit specific
  propertyAddress: text("property_address"),
  mapUrl:          text("map_url"),

  reminderSent:  boolean("reminder_sent").notNull().default(false),
  metadata:      jsonb("metadata").default({}),

  createdAt:  timestamp("created_at").notNull().defaultNow(),
  updatedAt:  timestamp("updated_at").notNull().defaultNow(),
})

export type Meeting    = typeof meetings.$inferSelect
export type NewMeeting = typeof meetings.$inferInsert


export const meetingsRelations = relations(meetings, ({ one }) => ({
  organization: one(organization, { fields: [meetings.organizationId], references: [organization.id] }),
  lead:         one(leads, { fields: [meetings.leadId], references: [leads.id] }),
}))
