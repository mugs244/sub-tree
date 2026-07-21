import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { recordAdImpression } from "@/lib/services/ad-analytics"

// Reported by the feed when an ad is actually rendered. Public — the feed
// serves anonymous viewers too, so no session is required; a logged-in
// viewer's id is captured opportunistically for Analytics demographics, while
// device_id is what frequency capping keys on. Recording on render (not on
// selection) keeps a viewer's cap honest — a selected-but-unseen ad shouldn't
// count against them.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession().catch(() => null)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const { bookingId, deviceId, ageGroup, region } = (body ?? {}) as {
    bookingId?: number
    deviceId?: string
    ageGroup?: string
    region?: string
  }
  if (typeof bookingId !== "number" || !Number.isInteger(bookingId)) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "bookingId is required" }, { status: 400 })
  }

  await recordAdImpression({
    bookingId,
    viewerUserId: session?.userId,
    deviceId: typeof deviceId === "string" ? deviceId : undefined,
    ageGroup: typeof ageGroup === "string" ? ageGroup : undefined,
    region: typeof region === "string" ? region : undefined,
  })
  return NextResponse.json({ data: { ok: true } }, { status: 201 })
}
