import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

function generateTempPassword() {
  // 12 random bytes, base64url-ish, trimmed to keep it easy to read aloud/type.
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  const raw = Array.from(bytes, (b) => b.toString(36)).join("")
  return `${raw.slice(0, 10)}#${raw.slice(10, 14) || "9x1"}`
}

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()
  if (!profile?.is_admin) {
    return { user: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { user, error: null }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error: authError } = await requireAdmin()
  if (authError) return authError

  const admin = createAdminClient()
  const tempPassword = generateTempPassword()

  const { error: updateError } = await admin.auth.admin.updateUserById(id, { password: tempPassword })
  if (updateError) {
    console.error("[v0] Failed to reset password:", updateError)
    return NextResponse.json({ error: "Failed to reset password." }, { status: 400 })
  }

  const { error: profileError } = await admin.from("profiles").update({ must_change_password: true }).eq("id", id)
  if (profileError) {
    console.error("[v0] Failed to flag password reset:", profileError)
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 })
  }

  return NextResponse.json({ password: tempPassword })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { user, error: authError } = await requireAdmin()
  if (authError) return authError

  if (user!.id === id) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: target } = await admin.from("profiles").select("is_admin").eq("id", id).single()
  if (target?.is_admin) {
    const { count } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_admin", true)
    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: "Can't delete the last remaining admin account." }, { status: 400 })
    }
  }

  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) {
    console.error("[v0] Failed to delete user:", error)
    return NextResponse.json({ error: "Failed to delete the account." }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
