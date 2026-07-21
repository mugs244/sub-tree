import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { inHouseAdRouter } from "@/lib/services/ad-router"

// Ad-tre serving endpoint — the feed calls this to ask "what ad, if any, do I
// show this device right now". Public (the feed serves anonymous viewers), so
// no session is required; a logged-in viewer's id is passed through when
// present. The device_id is client-generated and stored in a first-party
// cookie — the frequency-cap key. This only DECIDES; the feed reports the
// impression separately when it actually renders the ad.
export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url)
  const deviceId = url.searchParams.get("deviceId")
  if (!deviceId) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "deviceId is required" }, { status: 400 })
  }

  const session = await getSession().catch(() => null)

  const decision = await inHouseAdRouter.selectAdForDevice({
    deviceId,
    viewerUserId: session?.userId,
  })

  return NextResponse.json({ data: decision })
}
