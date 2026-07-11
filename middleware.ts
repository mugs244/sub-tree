import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// /api/payments is deliberately NOT protected — POST /api/payments/initiate
// is the public donation endpoint, called by anonymous donors on a
// creator's public profile page. Gating it here would break every donation.
const PROTECTED = ["/dashboard", "/onboarding", "/admin", "/fan", "/api/admin", "/api/links", "/api/posts", "/api/notifications", "/api/creator", "/api/donations", "/api/account", "/api/profile", "/api/onboarding", "/api/views", "/api/fan", "/api/subscriptions"]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
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
