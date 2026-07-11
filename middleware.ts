import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// /api/payments and /api/views are deliberately NOT protected:
//  - POST /api/payments/initiate is the public donation endpoint, called by
//    anonymous donors on a creator's public profile page.
//  - POST /api/views/[username] is the public page-view tracker, called by
//    anonymous visitors loading a creator's public profile page — the route
//    itself already checks the session internally to skip incrementing when
//    the viewer is the profile owner.
// Gating either here would silently break for the vast majority of callers,
// who are never logged in.
const PROTECTED = ["/dashboard", "/onboarding", "/admin", "/fan", "/api/admin", "/api/links", "/api/posts", "/api/notifications", "/api/creator", "/api/donations", "/api/account", "/api/profile", "/api/onboarding", "/api/fan", "/api/subscriptions"]

// Individual public routes that fall under an otherwise-protected prefix
// above (their sibling routes genuinely are creator/fan-account-only, so the
// whole prefix can't just be unprotected) — checked before the prefix match.
//  - POST /api/links/[id]/click — public link-click tracker on a profile page.
//  - GET /api/subscriptions/tiers/[handle] — a creator's tier list, shown to
//    a prospective fan who isn't subscribed (or signed in) yet.
const PUBLIC_EXCEPTIONS = [/^\/api\/links\/[^/]+\/click$/, /^\/api\/subscriptions\/tiers\/[^/]+$/]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (PUBLIC_EXCEPTIONS.some((re) => re.test(pathname))) return NextResponse.next()

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get("st_session")?.value
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = "/sign-in"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
