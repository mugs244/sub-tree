import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { recordAdImpression } from "@/lib/services/ad-analytics"

// Integration point for the ad-serving engine (Ad-tre): it calls this each
// time a published ad is shown, to build the Analytics data. Requires a
// logged-in viewer for now — the serving surface is authenticated. A booking
// id is trusted as-is here (the serving engine picks it); it isn't scoped to
// the caller's own advertiser because the viewer is the audience, not the
// advertiser.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const { bookingId, ageGroup, region } = (body ?? {}) as { bookingId?: number; ageGroup?: string; region?: string }
  if (typeof bookingId !== "number" || !Number.isInteger(bookingId)) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "bookingId is required" }, { status: 400 })
  }

  await recordAdImpression({
    bookingId,
    viewerUserId: session.userId,
    ageGroup: typeof ageGroup === "string" ? ageGroup : undefined,
    region: typeof region === "string" ? region : undefined,
  })
  return NextResponse.json({ data: { ok: true } }, { status: 201 })
}
