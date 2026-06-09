"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { Loader2, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await authClient.signIn.email({
        email: form.email, password: form.password,
      })
      if (error) { toast.error(error.message ?? "Invalid email or password"); return }
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
      <div className="flex items-center gap-2 lg:hidden">
        <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold"
          style={{ background: "var(--accent)", color: "#000" }}>R</div>
        <span className="font-semibold">ReachAI</span>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "var(--text-1)" }}>
          Welcome back
        </h1>
        <p className="text-sm" style={{ color: "var(--text-2)" }}>
          Sign in to your agency workspace
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {[
          { id: "email",    label: "Email",    type: "email",    placeholder: "rahul@prestigehomes.com" },
          { id: "password", label: "Password", type: "password", placeholder: "••••••••" },
        ].map((field) => (
          <div key={field.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={field.id} className="text-xs font-medium" style={{ color: "var(--text-2)" }}>
                {field.label}
              </label>
              {field.id === "password" && (
                <Link href="/forgot-password" className="text-xs transition-colors"
                  style={{ color: "var(--text-3)" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-3)"}
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <input
              id={field.id}
              name={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={form[field.id as keyof typeof form]}
              onChange={handleChange}
              required
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
              : <>Sign in <ArrowRight className="w-4 h-4" /></>
            }
          </button>
        </div>
      </form>

      <p className="text-xs text-center" style={{ color: "var(--text-3)" }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium transition-colors"
          style={{ color: "var(--text-2)" }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-2)"}
        >
          Create one
        </Link>
      </p>
    </div>
  )
}
