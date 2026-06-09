import { pgTable, text, timestamp, boolean, jsonb, integer } from "drizzle-orm/pg-core"
import { organization } from "./auth"
import { leads } from "./leads"
import { relations } from "drizzle-orm"

// every message ever sent or received
export const messages = pgTable("messages", {
  id:             text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  leadId:         text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),

  channel:    text("channel").notNull(), // email, whatsapp, sms, voice
  direction:  text("direction").notNull(), // outbound, inbound
  status:     text("status").notNull().default("pending"), // pending, sent, delivered, read, failed

  subject:    text("subject"),   // email only
  body:       text("body").notNull(),
  aiGenerated: boolean("ai_generated").notNull().default(false),

  // provider response metadata
  externalId: text("external_id"), // twilio/resend message id
  metadata:   jsonb("metadata").default({}),

  sentAt:     timestamp("sent_at"),
  readAt:     timestamp("read_at"),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
})

// outreach sequences — series of follow-ups
export const sequences = pgTable("sequences", {
  id:             text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  leadId:         text("lead_id").notNull().references(() => leads.id, { onDelete: "cascade" }),

  status:       text("status").notNull().default("active"), // active, paused, completed, stopped
  currentStep:  integer("current_step").notNull().default(1),
  totalSteps:   integer("total_steps").notNull().default(3),
  nextSendAt:   timestamp("next_send_at"),

  createdAt:    timestamp("created_at").notNull().defaultNow(),
  updatedAt:    timestamp("updated_at").notNull().defaultNow(),
})

export type Message     = typeof messages.$inferSelect
export type NewMessage  = typeof messages.$inferInsert
export type Sequence    = typeof sequences.$inferSelect


export const messagesRelations = relations(messages, ({ one }) => ({
  organization: one(organization, { fields: [messages.organizationId], references: [organization.id] }),
  lead:         one(leads, { fields: [messages.leadId], references: [leads.id] }),
}))

export const sequencesRelations = relations(sequences, ({ one }) => ({
  organization: one(organization, { fields: [sequences.organizationId], references: [organization.id] }),
  lead:         one(leads, { fields: [sequences.leadId], references: [leads.id] }),
}))
