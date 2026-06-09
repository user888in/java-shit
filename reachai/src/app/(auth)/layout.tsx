export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* left — branding panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-12 relative overflow-hidden"
        style={{ background: "var(--surface)", borderRight: "1px solid var(--border)" }}
      >
        {/* grid texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(var(--text-1) 1px, transparent 1px),
                              linear-gradient(90deg, var(--text-1) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />

        {/* accent glow */}
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-[120px] opacity-10"
          style={{ background: "var(--accent)" }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--accent)", color: "#000" }}
            >
              R
            </div>
            <span className="font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
              ReachAI
            </span>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: "var(--accent-dim)",
                color: "var(--accent)",
                border: "1px solid var(--accent)30",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
              Trusted by 200+ agencies
            </div>
            <h1
              className="text-3xl font-semibold leading-tight tracking-tight"
              style={{ color: "var(--text-1)" }}
            >
              Close deals while<br />you sleep.
            </h1>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
              ReachAI finds qualified leads, reaches out with hyper-personalized messages,
              and books meetings — fully autonomous.
            </p>
          </div>

          {/* stat row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "3.2×", label: "more meetings" },
              { value: "68%", label: "reply rate" },
              { value: "24/7", label: "always on" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg p-3 space-y-0.5"
                style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              >
                <p className="text-lg font-semibold tracking-tight" style={{ color: "var(--accent)" }}>
                  {s.value}
                </p>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* testimonial */}
          <div
            className="rounded-lg p-4 space-y-3"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-2)" }}>
              "Closed 3 deals in the first week. The AI knows exactly what to say and when."
            </p>
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ background: "var(--border-2)", color: "var(--text-1)" }}
              >
                PS
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: "var(--text-1)" }}>Priya Sharma</p>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>Sales Director, Prestige Homes</p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs" style={{ color: "var(--text-3)" }}>
          © {new Date().getFullYear()} ReachAI
        </p>
      </div>

      {/* right — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        {children}
      </div>
    </div>
  )
}
