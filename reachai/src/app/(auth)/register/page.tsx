"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { Loader2, ArrowRight } from "lucide-react"

export default function RegisterPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", password: "", agencyName: "" })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: form.name, email: form.email, password: form.password,
      })
      if (signUpError) { toast.error(signUpError.message ?? "Failed to create account"); return }

      const { error: signInError } = await authClient.signIn.email({
        email: form.email, password: form.password,
      })
      if (signInError) { toast.error(signInError.message ?? "Sign in failed"); return }

      const { error: orgError } = await authClient.organization.create({
        name: form.agencyName,
        slug: form.agencyName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      })
      if (orgError) { toast.error(orgError.message ?? "Failed to create workspace"); return }

      toast.success("Workspace ready!")
      router.push("/dashboard")
      router.refresh()
    } catch {
      toast.error("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[400px] space-y-6">
      {/* mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
          style={{ background: "var(--accent)", color: "#000" }}>R</div>
        <span className="font-semibold">ReachAI</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
          Create your workspace
        </h1>
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Get your AI sales agent running in 60 seconds
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {[
          { id: "name",       label: "Your name",    type: "text",     placeholder: "Rahul Verma" },
          { id: "agencyName", label: "Agency name",  type: "text",     placeholder: "Prestige Homes" },
          { id: "email",      label: "Work email",   type: "email",    placeholder: "rahul@prestigehomes.com" },
          { id: "password",   label: "Password",     type: "password", placeholder: "Min. 8 characters" },
        ].map((field) => (
          <div key={field.id} className="space-y-1.5">
            <label htmlFor={field.id} className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
              {field.label}
            </label>
            <input
              id={field.id}
              name={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={form[field.id as keyof typeof form]}
              onChange={handleChange}
              required
              minLength={field.id === "password" ? 8 : undefined}
              disabled={loading}
              className="w-full px-3 py-2.5 rounded text-sm outline-none transition-all disabled:opacity-50"
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-2)",
                color: "var(--text-1)",
                fontFamily: "var(--font-sans)",
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-2)"}
            />
          </div>
        ))}

        <div className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded text-sm font-medium transition-all disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#000" }}
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <>Create workspace <ArrowRight className="w-4 h-4" /></>
            }
          </button>
        </div>
      </form>

      <p className="text-xs text-center" style={{ color: "var(--text-3)" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-medium transition-colors"
          style={{ color: "var(--text-2)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-2)"}
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
