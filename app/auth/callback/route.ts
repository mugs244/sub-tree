import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import { createSession, applySessionCookie } from "@/lib/auth/session"
import { findOrCreateOAuthUser } from "@/lib/auth/oauth"
import { isAdmin } from "@/lib/services/admin"
import { getIpFromHeaders } from "@/lib/utils/geo"

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
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
        },
      },
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error || !data.user?.email) return fail("oauth_failed")

    const { userId } = await findOrCreateOAuthUser(data.user.email, getIpFromHeaders(req.headers))
    await supabase.auth.signOut({ scope: "local" })

    const { token, expires_at } = await createSession(userId)
    const dest = next ?? (isAdmin(userId) ? "/admin" : "/dashboard")
    const res = NextResponse.redirect(new URL(dest, url.origin))
    return applySessionCookie(res, token, expires_at)
  } catch (err) {
    console.error("OAuth callback error:", err)
    return fail("oauth_failed")
  }
}

// Only same-site paths — never let ?next= bounce a fresh session off-site.
function safeNext(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null
  return next
}
