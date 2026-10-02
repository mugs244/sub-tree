import { randomBytes } from "node:crypto"
import { NextResponse, type NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { authorizeUrl, isConnectProvider, ConnectError } from "@/lib/services/connect"

type Props = { params: Promise<{ provider: string }> }

// Add link → Connect: sends the creator to the platform's sign-in page.
// A one-time state value in a short-lived cookie is checked on the way back.
export async function GET(req: NextRequest, { params }: Props): Promise<NextResponse> {
  const { provider } = await params
  const session = await getSession()
  if (!session) return NextResponse.redirect(new URL(`/sign-in?next=/dashboard/links`, req.url))
  if (!isConnectProvider(provider)) return NextResponse.redirect(new URL("/dashboard/links?connect_error=unknown", req.url))

  const state = randomBytes(24).toString("base64url")
  const redirectUri = `${req.nextUrl.origin}/api/connect/${provider}/callback`
  try {
    const res = NextResponse.redirect(authorizeUrl(provider, redirectUri, state))
    res.cookies.set("st_connect", `${provider}.${state}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/connect",
      maxAge: 600,
    })
    return res
  } catch (err) {
    if (err instanceof ConnectError) return NextResponse.redirect(new URL(`/dashboard/links?connect_error=${err.code.toLowerCase()}`, req.url))
    throw err
  }
}
