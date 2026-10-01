import { createBrowserClient } from "@supabase/ssr"

// Supabase is used only as the Google/Apple OAuth broker. Sub-tree's own
// users and st_session cookie stay the source of truth — see
// app/auth/callback/route.ts, which trades the Supabase login for one of ours.
export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_AUTH_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    key:
      process.env.NEXT_PUBLIC_SUPABASE_AUTH_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
}

export function createSupabaseBrowserClient() {
  const { url, key } = getSupabaseConfig()
  return createBrowserClient(url!, key!)
}
