import { pgTable, text, integer, timestamp, jsonb, boolean } from "drizzle-orm/pg-core"
import { organization } from "./auth"
import { relations } from "drizzle-orm"
import { messages, sequences } from "./outreach"
import { meetings } from "./meetings"
import { activities } from "./activity"

export const leads = pgTable("leads", {
  id:             text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),

  // basic info
  firstName:  text("first_name").notNull(),
  lastName:   text("last_name"),
  email:      text("email"),
  phone:      text("phone"),
  whatsapp:   text("whatsapp"),
  company:    text("company"),
  jobTitle:   text("job_title"),

  // property intent
  propertyType:     text("property_type"),   // apartment, villa, plot, commercial
  budgetMin:        integer("budget_min"),
  budgetMax:        integer("budget_max"),
  preferredLocation: text("preferred_location"),
  bhkRequirement:   text("bhk_requirement"), // 1BHK, 2BHK, 3BHK etc
  possession:       text("possession"),      // ready, under_construction, any

  // lead metadata
  source:     text("source").notNull().default("manual"), // manual, csv, form, meta, google, portal
  status:     text("status").notNull().default("new"),    // new, contacted, qualified, meeting_scheduled, site_visit, negotiating, closed_won, closed_lost
  score:      integer("score").notNull().default(0),      // 0-100
  scoreBucket: text("score_bucket").notNull().default("cold"), // hot, warm, cold
  assignedTo: text("assigned_to"),  // user id of agent handling this lead

  // extra data from enrichment or form
  metadata:   jsonb("metadata").default({}),

  // flags
  isArchived: boolean("is_archived").notNull().default(false),
  isConverted: boolean("is_converted").notNull().default(false),

  createdAt:  timestamp("created_at").notNull().defaultNow(),
  updatedAt:  timestamp("updated_at").notNull().defaultNow(),
})

export type Lead    = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert


export const leadsRelations = relations(leads, ({ one, many }) => ({
  organization: one(organization, { fields: [leads.organizationId], references: [organization.id] }),
  messages:     many(messages),
  sequences:    many(sequences),
  meetings:     many(meetings),
  activities:   many(activities),
}))
