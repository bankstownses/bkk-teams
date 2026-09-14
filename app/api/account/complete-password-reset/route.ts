import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Clears the forced must_change_password flag for the signed-in user, once
 * they've set their own new password. Profiles have no self-update RLS
 * policy (an is_admin escalation risk), so this flips the single column via
 * the service-role client after independently verifying the caller's own
 * session — a user can only ever clear their own flag this way.
 */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from("profiles").update({ must_change_password: false }).eq("id", user.id)

  if (error) {
    console.error("[v0] Failed to clear password-reset flag:", error)
    return NextResponse.json({ error: "Failed to update account." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
