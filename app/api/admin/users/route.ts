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

export async function GET() {
  const { error: authError } = await requireAdmin()
  if (authError) return authError

  const admin = createAdminClient()

  const { data: profiles, error: profilesError } = await admin
    .from("profiles")
    .select("id, username, vehicle, is_admin, must_change_password, created_at")
    .order("created_at", { ascending: true })

  if (profilesError) {
    console.error("[v0] Failed to load profiles:", profilesError)
    return NextResponse.json({ error: "Failed to load accounts" }, { status: 500 })
  }

  const { data: userList, error: listError } = await admin.auth.admin.listUsers()
  if (listError) {
    console.error("[v0] Failed to list auth users:", listError)
    return NextResponse.json({ error: "Failed to load accounts" }, { status: 500 })
  }

  const emailById = new Map<string, string | null>()
  for (const u of userList.users) {
    emailById.set(u.id, u.email ?? null)
  }
  const users = (profiles ?? []).map((p) => ({ ...p, email: emailById.get(p.id) ?? null }))

  return NextResponse.json({ users })
}

export async function POST(request: Request) {
  const { error: authError } = await requireAdmin()
  if (authError) return authError

  const body = await request.json().catch(() => null)
  const email = typeof body?.email === "string" ? body.email.trim() : ""
  const password = typeof body?.password === "string" ? body.password : ""
  const username = typeof body?.username === "string" ? body.username.trim() : ""
  const vehicle = typeof body?.vehicle === "string" ? body.vehicle : ""

  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 })
  if (!username) return NextResponse.json({ error: "Name is required." }, { status: 400 })
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: vehicleRow } = await admin.from("vehicles").select("code").eq("code", vehicle).single()
  if (!vehicleRow) return NextResponse.json({ error: "Please select a valid vehicle." }, { status: 400 })

  const { data, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, vehicle },
  })

  if (createError) {
    console.error("[v0] Failed to create user:", createError)
    const message = createError.code === "email_exists" ? "An account with that email already exists." : "Failed to create the account."
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ user: { id: data.user.id, email: data.user.email } }, { status: 201 })
}
