import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Service-role client. NEVER import this from client components — it
 * bypasses RLS entirely. Only use it from server-only code (Route
 * Handlers, Server Components, Server Actions) after the caller has
 * already been verified as an admin.
 */
export function createAdminClient() {
  return createSupabaseClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
