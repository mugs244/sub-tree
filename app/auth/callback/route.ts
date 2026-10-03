import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { getSupabaseConfig } from "@/lib/supabase/client"
import { createSession, applySessionCookie } from "@/lib/auth/session"
import { findOrCreateOAuthUser } from "@/lib/auth/oauth"
import { isAdmin } from "@/lib/services/admin"
import { getIpFromHeaders } from "@/lib/utils/geo"
import { getLoginContext } from "@/lib/auth/login-context"
import { notifyNewSignIn } from "@/lib/services/security-notify"

// Supabase redirects here after Google/Apple sign-in with a one-time code.
// We exchange it for the provider-verified email, map that to a Sub-tree
// user, issue our own st_session cookie, and drop the Supabase session —
// nothing else in the app knows or cares that Supabase was involved.
export async function GET(req: Request) {
  const url = new URL(req.url)
  const code = url.searchParams.get("code")
  const next = safeNext(url.searchParams.get("next"))

  const fail = (reason: string) => {
    const to = new URL("/sign-in", url.origin)
    to.searchParams.set("error", reason)
    return NextResponse.redirect(to)
  }

  if (!code) return fail("oauth_failed")

  try {
    const cookieStore = await cookies()
    const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig()
    if (!supabaseUrl || !supabaseKey) return fail("oauth_unconfigured")

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    })

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error || !data.user?.email) return fail("oauth_failed")

    const { userId, created } = await findOrCreateOAuthUser(data.user.email, getIpFromHeaders(req.headers))
    // Brand-new accounts get no "new sign-in" alert — that would be noise.
    if (!created) await notifyNewSignIn(userId, getLoginContext(req.headers), "Google")
    await supabase.auth.signOut({ scope: "local" })

    const { token, expires_at } = await createSession(userId)
    // Brand-new Google accounts start on the profile step (photo + name),
    // prefilled from their Google account.
    const dest = next ?? (created ? profileStepUrl(data.user.user_metadata) : isAdmin(userId) ? "/admin" : "/dashboard")
    const res = NextResponse.redirect(new URL(dest, url.origin))
    return applySessionCookie(res, token, expires_at)
  } catch (err) {
    console.error("OAuth callback error:", err)
    return fail("oauth_failed")
  }
}

function profileStepUrl(meta: Record<string, unknown> | undefined): string {
  const q = new URLSearchParams()
  const name = typeof meta?.full_name === "string" ? meta.full_name : typeof meta?.name === "string" ? meta.name : ""
  const photo = typeof meta?.avatar_url === "string" ? meta.avatar_url : typeof meta?.picture === "string" ? meta.picture : ""
  if (name) q.set("name", name.slice(0, 80))
  if (photo) q.set("photo", photo)
  const qs = q.toString()
  return `/onboarding/profile${qs ? `?${qs}` : ""}`
}

// Only same-site paths — never let ?next= bounce a fresh session off-site.
function safeNext(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null
  return next
}
