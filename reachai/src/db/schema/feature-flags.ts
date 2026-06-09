import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core"
import { organization } from "./auth"
import { relations } from "drizzle-orm"


export const featureFlags = pgTable("feature_flags", {
  id:             text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().unique().references(() => organization.id, { onDelete: "cascade" }),

  // outreach channels
  emailEnabled:     boolean("email_enabled").notNull().default(true),
  whatsappEnabled:  boolean("whatsapp_enabled").notNull().default(false),
  smsEnabled:       boolean("sms_enabled").notNull().default(false),
  voiceEnabled:     boolean("voice_enabled").notNull().default(false),

  // ai features
  aiOutreachEnabled:    boolean("ai_outreach_enabled").notNull().default(true),
  aiAutoReplyEnabled:   boolean("ai_auto_reply_enabled").notNull().default(false),
  aiScoringEnabled:     boolean("ai_scoring_enabled").notNull().default(true),

  // integrations
  calComEnabled:    boolean("cal_com_enabled").notNull().default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export type FeatureFlags    = typeof featureFlags.$inferSelect
export type NewFeatureFlags = typeof featureFlags.$inferInsert

export const featureFlagsRelations = relations(featureFlags, ({ one }) => ({
  organization: one(organization, { fields: [featureFlags.organizationId], references: [organization.id] }),
}))
