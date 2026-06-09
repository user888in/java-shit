import type { leads, meetings, messages, featureFlags, activities } from "@/db/schema"

// ─── Lead types ───────────────────────────────────────────────────────────────

export type Lead    = typeof leads.$inferSelect
export type NewLead = typeof leads.$inferInsert

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "meeting_scheduled"
  | "site_visit"
  | "negotiating"
  | "closed_won"
  | "closed_lost"

export type LeadScoreBucket = "hot" | "warm" | "cold"

export type LeadSource =
  | "manual"
  | "csv"
  | "form"
  | "meta"
  | "google"
  | "portal"

export type PropertyType = "apartment" | "villa" | "plot" | "commercial"

// ─── Message types ────────────────────────────────────────────────────────────

export type Message    = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert

export type Channel   = "email" | "whatsapp" | "sms" | "voice"
export type Direction = "outbound" | "inbound"

export type MessageStatus =
  | "pending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"

// ─── Meeting types ────────────────────────────────────────────────────────────

export type Meeting    = typeof meetings.$inferSelect
export type NewMeeting = typeof meetings.$inferInsert

export type MeetingType   = "call" | "video_call" | "site_visit" | "office_visit"
export type MeetingStatus = "scheduled" | "completed" | "cancelled" | "no_show"

// ─── Feature flag types ───────────────────────────────────────────────────────

export type FeatureFlags = typeof featureFlags.$inferSelect

// ─── Activity types ───────────────────────────────────────────────────────────

export type Activity    = typeof activities.$inferSelect
export type NewActivity = typeof activities.$inferInsert

export type ActivityType =
  | "lead_created"
  | "lead_updated"
  | "message_sent"
  | "message_received"
  | "meeting_scheduled"
  | "meeting_completed"
  | "status_changed"
  | "score_updated"
  | "note_added"
  | "call_completed"

// ─── API response types ───────────────────────────────────────────────────────

export type ApiResponse<T> = {
  data: T
  error: null
} | {
  data: null
  error: string
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// ─── Org context type (attached to every server request) ─────────────────────

export type OrgContext = {
  userId:         string
  organizationId: string
  role:           "owner" | "admin" | "member"
}
