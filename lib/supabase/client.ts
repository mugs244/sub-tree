import { createBrowserClient } from "@supabase/ssr"

// Supabase is used only as the Google/Apple OAuth broker. Sub-tree's own
// users and st_session cookie stay the source of truth — see
// app/auth/callback/route.ts, which trades the Supabase login for one of ours.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
