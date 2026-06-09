export const AppName = "ReachAi";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

export const LEAD_STATUS = {
  NEW: "new",
  CONTACTED: "contacted",
  QUALIFIED: "qualified",
  MEETING_SCHEDULED: "meeting_scheduled",
  SITE_VISIT: "site_visit",
  NEGOTIATING: "negotiating",
  CLOSED_WON: "closed_won",
  CLOSED_LOST: "closed_lost",
} as const;

export const LEAD_SCORE = {
  HOT: "hot",       // 70–100
  WARM: "warm",     // 40–69
  COLD: "cold",     // 0–39
} as const

export const CHANNELS = {
  EMAIL: "email",
  WHATSAPP: "whatsapp",
  SMS: "sms",
  VOICE: "voice",
} as const

export type LeadStatus = typeof LEAD_STATUS[keyof typeof LEAD_STATUS]
export type LeadScore  = typeof LEAD_SCORE[keyof typeof LEAD_SCORE]
export type Channel    = typeof CHANNELS[keyof typeof CHANNELS]
