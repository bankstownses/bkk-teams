"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import Link from "next/link"

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

type CrewUser = {
  id: string
  username: string | null
  vehicle: string | null
  is_admin: boolean
  email: string | null
  created_at: string
}

export default function AdminUsersPanel({ adminUsername }: { adminUsername: string | null }) {
  const [users, setUsers] = useState<CrewUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [username, setUsername] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function loadUsers() {
    setLoadingUsers(true)
    try {
      const res = await fetch("/api/admin/users")
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || "Failed to load accounts")
      setUsers(body.users ?? [])
    } catch (err) {
      console.error("[v0] Failed to load accounts:", err)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!vehicle) {
      setError("Please select a vehicle.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, vehicle, email, password }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || "Failed to create account")
      setSuccess(`Account created for ${email}.`)
      setUsername("")
      setVehicle("")
      setEmail("")
      setPassword("")
      loadUsers()
    } catch (err) {
      console.error("[v0] Create account error:", err)
      setError(err instanceof Error ? err.message : "Failed to create account")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-heading text-2xl font-bold tracking-wide text-foreground">CREW ACCOUNTS</div>
            <div className="font-sans text-xs text-muted-foreground">Signed in as {adminUsername ?? "Admin"}</div>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-border px-4 py-2 font-sans text-xs font-semibold text-muted-foreground"
          >
            Back to dispatch
          </Link>
        </div>

        <form onSubmit={handleCreate} className="flex flex-col gap-5 rounded-xl border border-border bg-panel p-6">
          <div className="font-heading text-sm font-bold tracking-wide text-foreground">CREATE ACCOUNT</div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="crew@bankstownses.com"
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="font-sans text-xs font-semibold text-muted-foreground">
                Temporary password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 font-sans text-xs text-danger">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 font-sans text-xs text-foreground">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="self-start rounded-lg bg-primary px-5 py-2.5 font-heading text-sm font-bold tracking-wide text-primary-foreground disabled:opacity-60"
          >
            {isSubmitting ? "CREATING…" : "CREATE ACCOUNT"}
          </button>
        </form>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-panel p-6">
          <div className="font-heading text-sm font-bold tracking-wide text-foreground">EXISTING ACCOUNTS</div>
          {loadingUsers ? (
            <div className="font-sans text-xs text-muted-foreground">Loading…</div>
          ) : users.length === 0 ? (
            <div className="font-sans text-xs text-muted-foreground">No accounts yet.</div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-sans text-sm font-semibold text-foreground">{u.username ?? "—"}</span>
                    <span className="font-sans text-xs text-muted-foreground">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-md border border-border px-2 py-1 font-mono text-xs text-muted-foreground">
                      {u.vehicle ?? "—"}
                    </span>
                    {u.is_admin && (
                      <span className="rounded-md bg-primary/10 px-2 py-1 font-sans text-xs font-semibold text-primary">
                        Admin
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
