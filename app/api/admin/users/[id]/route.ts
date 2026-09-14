import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

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
  const { data: target, error: targetError } = await admin.auth.admin.getUserById(id)
  if (targetError || !target.user.email) {
    console.error("[v0] Failed to find reset recipient:", targetError)
    return NextResponse.json({ error: "Could not find an email for this account." }, { status: 400 })
  }

  const redirectTo = new URL("/auth/callback?next=/auth/update-password", request.url).toString()
  const supabase = await createClient()
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(target.user.email, { redirectTo })
  if (resetError) {
    console.error("[v0] Failed to send password reset email:", resetError)
    return NextResponse.json({ error: "Failed to send the password reset email." }, { status: 400 })
  }

  const { error: profileError } = await admin.from("profiles").update({ must_change_password: true }).eq("id", id)
  if (profileError) {
    console.error("[v0] Failed to flag password reset:", profileError)
    return NextResponse.json({ error: "Email sent, but failed to update the account status." }, { status: 500 })
  }

  return NextResponse.json({ email: target.user.email })
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
