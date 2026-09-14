import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminUsersPanel from "@/components/admin-users-panel"

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("profiles").select("is_admin, username").eq("id", user.id).single()
  if (!profile?.is_admin) redirect("/")

  return <AdminUsersPanel adminUsername={profile.username} />
}
