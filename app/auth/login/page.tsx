"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function loginErrorMessage(error: unknown): string {
  const { code, status } = (error ?? {}) as { code?: string; status?: number }

  if (code === "email_not_confirmed") {
    return "Please confirm your email address — check your inbox for the link."
  }
  if (code === "over_request_rate_limit" || status === 429) {
    return "Too many attempts. Please wait a moment and try again."
  }
  if (code === "invalid_credentials") {
    return "Invalid email or password."
  }
  return "Something went wrong. Please try again."
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      router.push("/")
      router.refresh()
    } catch (err) {
      console.error("[v0] Login error:", err)
      setError(loginErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="font-heading text-2xl font-bold tracking-wide text-foreground">BKK-TEAMS</div>
          <div className="font-sans text-xs text-muted-foreground">Vehicle dispatch and incident management</div>
        </div>

        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-5 rounded-xl border border-border bg-panel p-6"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="font-sans text-xs font-semibold text-muted-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@bankstownses.com"
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="font-sans text-xs font-semibold text-muted-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 font-sans text-sm text-foreground outline-none focus:border-primary"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 font-sans text-xs text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-1 rounded-lg bg-primary py-2.5 font-heading text-sm font-bold tracking-wide text-primary-foreground disabled:opacity-60"
          >
            {isLoading ? "SIGNING IN…" : "SIGN IN"}
          </button>

          <div className="text-center font-sans text-xs text-muted-foreground">
            {"Need an account? Contact your administrator."}
          </div>
        </form>
      </div>
    </div>
  )
}
