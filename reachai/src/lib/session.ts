import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { cache } from "react"

// cache() deduplicates calls within a single request
export const getSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session
})

// throws if not authenticated — use in protected server components
export async function requireSession() {
  const session = await getSession()
  if (!session) throw new Error("Unauthorized")
  return session
}

// returns the active org id from session
export async function getOrgId(): Promise<string> {
  const session = await requireSession()
  const orgId = session.session.activeOrganizationId
  if (!orgId) throw new Error("No active organization")
  return orgId
}
