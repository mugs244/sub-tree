import { NextResponse, type NextRequest } from "next/server"
import { getSession } from "@/lib/auth/session"
import { completeConnect, isConnectProvider, ConnectError } from "@/lib/services/connect"

type Props = { params: Promise<{ provider: string }> }

// The platform sends the creator back here after they sign in (or cancel).
// On success the link is saved and they land on Links with it highlighted.
export async function GET(req: NextRequest, { params }: Props): Promise<NextResponse> {
  const { provider } = await params
  const back = (q: string) => {
    const res = NextResponse.redirect(new URL(`/dashboard/links?${q}`, req.url))
    res.cookies.set("st_connect", "", { path: "/api/connect", maxAge: 0 })
    return res
  }

  const session = await getSession()
  if (!session) return NextResponse.redirect(new URL("/sign-in?next=/dashboard/links", req.url))
  if (!isConnectProvider(provider)) return back("connect_error=unknown")

  const sp = req.nextUrl.searchParams
  const cookie = req.cookies.get("st_connect")?.value
  if (!cookie || cookie !== `${provider}.${sp.get("state")}`) return back("connect_error=expired")
  if (sp.get("error") || !sp.get("code")) return back("connect_error=denied")

  try {
    const linkId = await completeConnect(session.userId, provider, sp.get("code")!, `${req.nextUrl.origin}/api/connect/${provider}/callback`)
    return back(`connected=${provider}&link=${linkId}`)
  } catch (err) {
    if (err instanceof ConnectError) {
      console.error("Connect failed", provider, err.message)
      return back(`connect_error=${err.code.toLowerCase()}`)
    }
    throw err
  }
}
