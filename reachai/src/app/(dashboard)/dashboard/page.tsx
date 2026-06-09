import { requireSession, getOrgId } from "@/lib/session"

export default async function DashboardPage() {
  const session = await requireSession()
  const orgId   = await getOrgId()

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
          Overview
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-2)" }}>
          Welcome back, {session.user.name}
        </p>
      </div>

      {/* stat cards — wired with real data in next step */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total leads",      value: "—" },
          { label: "Contacted today",  value: "—" },
          { label: "Meetings booked",  value: "—" },
          { label: "Deals closed",     value: "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-lg p-4 space-y-2"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>{s.label}</p>
            <p className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
