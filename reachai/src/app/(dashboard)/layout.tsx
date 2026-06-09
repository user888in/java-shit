import { redirect } from "next/navigation"
import { getSession, getOrgId } from "@/lib/session"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  let orgId: string | null = null
  try { orgId = await getOrgId() } catch { redirect("/onboarding") }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* sidebar */}
      <aside
        className="w-56 shrink-0 flex flex-col h-full"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        {/* logo */}
        <div className="h-14 flex items-center px-4 gap-2.5"
          style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--accent)", color: "#000" }}>R</div>
          <span className="font-semibold text-sm tracking-tight" style={{ color: "var(--text-1)" }}>
            ReachAI
          </span>
        </div>

        {/* nav */}
        <nav className="flex-1 p-2 space-y-0.5">
          {[
            { href: "/dashboard",          label: "Overview",  icon: "▦" },
            { href: "/dashboard/leads",    label: "Leads",     icon: "◈" },
            { href: "/dashboard/outreach", label: "Outreach",  icon: "◎" },
            { href: "/dashboard/meetings", label: "Meetings",  icon: "◷" },
            { href: "/dashboard/settings", label: "Settings",  icon: "◬" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-all"
              style={{ color: "var(--text-2)" }}
            >
              <span className="text-xs" style={{ color: "var(--text-3)" }}>{item.icon}</span>
              {item.label}
            </a>
          ))}
        </nav>

        {/* user */}
        <div className="p-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded"
            style={{ background: "var(--surface-2)" }}>
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
              style={{ background: "var(--border-2)", color: "var(--text-1)" }}>
              {session.user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--text-1)" }}>
                {session.user.name}
              </p>
              <p className="text-xs truncate" style={{ color: "var(--text-3)" }}>
                {session.user.email}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
