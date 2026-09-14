"use client"

import { useEffect, useState } from "react"
import type { FormEvent } from "react"
import Link from "next/link"

type CrewUser = {
  id: string
  username: string | null
  vehicle: string | null
  is_admin: boolean
  must_change_password: boolean
  email: string | null
  created_at: string
}

export default function AdminUsersPanel({
  adminUsername,
  adminId,
}: {
  adminUsername: string | null
  adminId: string
}) {
  const [users, setUsers] = useState<CrewUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [vehicles, setVehicles] = useState<string[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(true)

  const [username, setUsername] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newVehicle, setNewVehicle] = useState("")
  const [vehicleError, setVehicleError] = useState<string | null>(null)
  const [isAddingVehicle, setIsAddingVehicle] = useState(false)

  const [rowError, setRowError] = useState<string | null>(null)
  const [resetPasswordFor, setResetPasswordFor] = useState<{ username: string | null; password: string } | null>(
    null,
  )
  const [pendingRowId, setPendingRowId] = useState<string | null>(null)

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

  async function loadVehicles() {
    setLoadingVehicles(true)
    try {
      const res = await fetch("/api/admin/vehicles")
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || "Failed to load vehicles")
      setVehicles(body.vehicles ?? [])
    } catch (err) {
      console.error("[v0] Failed to load vehicles:", err)
    } finally {
      setLoadingVehicles(false)
    }
  }

  useEffect(() => {
    loadUsers()
    loadVehicles()
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
      setSuccess(`Account created for ${email}. They'll be asked to set a new password on first login.`)
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

  async function handleAddVehicle(e: FormEvent) {
    e.preventDefault()
    setVehicleError(null)

    if (!newVehicle.trim()) {
      setVehicleError("Please enter a vehicle code.")
      return
    }

    setIsAddingVehicle(true)
    try {
      const res = await fetch("/api/admin/vehicles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newVehicle }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || "Failed to add vehicle")
      setNewVehicle("")
      loadVehicles()
    } catch (err) {
      console.error("[v0] Add vehicle error:", err)
      setVehicleError(err instanceof Error ? err.message : "Failed to add vehicle")
    } finally {
      setIsAddingVehicle(false)
    }
  }

  async function handleResetPassword(user: CrewUser) {
    setRowError(null)
    setPendingRowId(user.id)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "PATCH" })
      const body = await res.json()
      if (!res.ok) throw new Error(body?.error || "Failed to reset password")
      setResetPasswordFor({ username: user.username, password: body.password })
      loadUsers()
    } catch (err) {
      console.error("[v0] Reset password error:", err)
      setRowError(err instanceof Error ? err.message : "Failed to reset password")
    } finally {
      setPendingRowId(null)
    }
  }

  async function handleDelete(user: CrewUser) {
    if (!window.confirm(`Delete the account for ${user.username ?? user.email}? This can't be undone.`)) {
      return
    }
    setRowError(null)
    setPendingRowId(user.id)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" })
      const body = await res.json().catch(() => null)
      if (!res.ok) throw new Error(body?.error || "Failed to delete account")
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    } catch (err) {
      console.error("[v0] Delete account error:", err)
      setRowError(err instanceof Error ? err.message : "Failed to delete account")
    } finally {
      setPendingRowId(null)
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

        {resetPasswordFor && (
          <div className="flex flex-col gap-2 rounded-xl border border-primary/40 bg-primary/10 p-4">
            <div className="font-sans text-xs font-semibold text-foreground">
              New temporary password for {resetPasswordFor.username ?? "this account"}
            </div>
            <div className="flex items-center justify-between gap-3">
              <code className="rounded-md border border-border bg-input px-3 py-2 font-mono text-sm text-foreground">
                {resetPasswordFor.password}
              </code>
              <button
                type="button"
                onClick={() => setResetPasswordFor(null)}
                className="rounded-lg border border-border px-3 py-2 font-sans text-xs font-semibold text-muted-foreground"
              >
                Dismiss
              </button>
            </div>
            <div className="font-sans text-xs text-muted-foreground">
              Share this with them directly. They'll be asked to set their own password on next login.
            </div>
          </div>
        )}

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
                disabled={loadingVehicles}
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 font-mono text-sm text-foreground outline-none focus:border-primary disabled:opacity-60"
              >
                <option value="" disabled>
                  {loadingVehicles ? "Loading…" : "Select a vehicle"}
                </option>
                {vehicles.map((v) => (
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
          {rowError && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 font-sans text-xs text-danger">
              {rowError}
            </div>
          )}
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
                    {u.must_change_password && (
                      <span className="font-sans text-xs text-muted-foreground">Awaiting first-login password set</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-border px-2 py-1 font-mono text-xs text-muted-foreground">
                      {u.vehicle ?? "—"}
                    </span>
                    {u.is_admin && (
                      <span className="rounded-md bg-primary/10 px-2 py-1 font-sans text-xs font-semibold text-primary">
                        Admin
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleResetPassword(u)}
                      disabled={pendingRowId === u.id}
                      className="rounded-md border border-border px-2 py-1 font-sans text-xs font-semibold text-muted-foreground disabled:opacity-60"
                    >
                      Reset password
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(u)}
                      disabled={pendingRowId === u.id || u.id === adminId}
                      title={u.id === adminId ? "You can't delete your own account" : undefined}
                      className="rounded-md border border-danger/40 px-2 py-1 font-sans text-xs font-semibold text-danger disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleAddVehicle} className="flex flex-col gap-4 rounded-xl border border-border bg-panel p-6">
          <div className="font-heading text-sm font-bold tracking-wide text-foreground">VEHICLES</div>

          <div className="flex flex-wrap gap-2">
            {loadingVehicles ? (
              <span className="font-sans text-xs text-muted-foreground">Loading…</span>
            ) : vehicles.length === 0 ? (
              <span className="font-sans text-xs text-muted-foreground">No vehicles yet.</span>
            ) : (
              vehicles.map((v) => (
                <span
                  key={v}
                  className="rounded-md border border-border bg-input px-2.5 py-1 font-mono text-xs text-foreground"
                >
                  {v}
                </span>
              ))
            )}
          </div>

          <div className="flex items-end gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label htmlFor="newVehicle" className="font-sans text-xs font-semibold text-muted-foreground">
                Add vehicle
              </label>
              <input
                id="newVehicle"
                type="text"
                value={newVehicle}
                onChange={(e) => setNewVehicle(e.target.value)}
                placeholder="e.g. BKK21"
                className="w-full rounded-lg border border-border bg-input px-3 py-2.5 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={isAddingVehicle}
              className="rounded-lg bg-primary px-5 py-2.5 font-heading text-sm font-bold tracking-wide text-primary-foreground disabled:opacity-60"
            >
              {isAddingVehicle ? "ADDING…" : "ADD"}
            </button>
          </div>

          {vehicleError && (
            <div className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 font-sans text-xs text-danger">
              {vehicleError}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
