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
  const { data: vehicles, error } = await admin.from("vehicles").select("code").order("code", { ascending: true })

  if (error) {
    console.error("[v0] Failed to load vehicles:", error)
    return NextResponse.json({ error: "Failed to load vehicles" }, { status: 500 })
  }

  return NextResponse.json({ vehicles: (vehicles ?? []).map((v) => v.code) })
}

export async function POST(request: Request) {
  const { error: authError } = await requireAdmin()
  if (authError) return authError

  const body = await request.json().catch(() => null)
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : ""

  if (!code) return NextResponse.json({ error: "Vehicle code is required." }, { status: 400 })
  if (code.length > 32) return NextResponse.json({ error: "Vehicle code is too long." }, { status: 400 })

  const admin = createAdminClient()
  const { error } = await admin.from("vehicles").insert({ code })

  if (error) {
    console.error("[v0] Failed to create vehicle:", error)
    const message = error.code === "23505" ? "That vehicle already exists." : "Failed to create the vehicle."
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({ vehicle: code }, { status: 201 })
}
