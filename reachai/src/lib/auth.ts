import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { organization } from "better-auth/plugins"
import { nextCookies } from "better-auth/next-js"
import { db } from "@/db"
import * as schema from "@/db/schema"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user:         schema.user,
      session:      schema.session,
      account:      schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member:       schema.member,
      invitation:   schema.invitation,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // flip to true once Resend is wired
  },

  session: {
    expiresIn:  60 * 60 * 24 * 7,
    updateAge:  60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge:  60 * 5,
    },
  },

  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 1,
      creatorRole: "owner",
      membershipLimit: 100,
    }),
    nextCookies(), // must stay last
  ],
})

export type Auth = typeof auth
