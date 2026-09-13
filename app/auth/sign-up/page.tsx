"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const VEHICLES = [
  "BKK31",
  "BKK32",
  "BKK33",
  "BKK36",
  "BKK37",
  "BKK44",
  "BKK56",
  "SES59",
  "SES43K",
  "BKK-FEIGE",
  "BKK-ALLPORT",
  "BKK-OFEIGE",
]

function signUpErrorMessage(error: unknown): string {
  const { code, status } = (error ?? {}) as { code?: string; status?: number }

  if (code === "weak_password") {
    return "Please choose a stronger password."
  }
  if (code === "email_address_invalid") {
    return "Please use a real email address — example and test domains are not supported."
  }
  if (code === "email_address_not_authorized") {
    return "We cannot send confirmation email to that address. Please use a different one."
  }
  if (code === "validation_failed") {
    return "Please check the details you entered."
  }
  if (code === "over_email_send_rate_limit" || status === 429) {
    return "Too many attempts. Please wait a moment and try again."
  }
  return "Unable to complete sign-up. Please try again."
}

export default function SignUpPage() {
  const [username, setUsername] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [repeatPassword, setRepeatPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!vehicle) {
      setError("Please select a vehicle.")
      return
    }
    if (password !== repeatPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
          data: { username, vehicle },
        },
      })
      if (error) throw error
      router.push("/auth/sign-up-success")
    } catch (err) {
      console.error("[v0] Sign-up error:", err)
      setError(signUpErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="font-heading text-2xl font-bold tracking-wide text-foreground">BKK-TEAMS</div>
          <div className="font-sans text-xs text-muted-foreground">Create your crew account</div>
        </div>

        <form
          onSubmit={handleSignUp}
          className="flex flex-col gap-5 rounded-xl border border-border bg-panel p-6"
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="font-sans text-xs font-semibold text-muted-foreground">
              Name
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Crew name"
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="vehicle" className="font-sans text-xs font-semibold text-muted-foreground">
              Vehicle
            </label>
            <select
              id="vehicle"
              required
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 font-mono text-sm text-foreground outline-none focus:border-primary"
            >
              <option value="" disabled>
                Select a vehicle
              </option>
              {VEHICLES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

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
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-3 py-2.5 font-sans text-sm text-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="repeat-password" className="font-sans text-xs font-semibold text-muted-foreground">
              Repeat password
            </label>
            <input
              id="repeat-password"
              type="password"
              required
              autoComplete="new-password"
              value={repeatPassword}
              onChange={(e) => setRepeatPassword(e.target.value)}
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
            {isLoading ? "CREATING ACCOUNT…" : "CREATE ACCOUNT"}
          </button>

          <div className="text-center font-sans text-xs text-muted-foreground">
            {"Already have an account? "}
            <Link href="/auth/login" className="font-semibold text-foreground underline underline-offset-4">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
