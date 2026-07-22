import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getFeedPage } from "@/lib/services/feed"
import { recordActivity } from "@/lib/services/activity"
import { readOrMintDeviceId, setDeviceCookie } from "@/lib/feed/device"

// Public short-form feed. Anonymous viewers are the norm, so no session is
// required; a logged-in viewer's id is passed to Ad-tre when present. The
// device id (minted into a cookie on first contact) is the frequency-cap key,
// and is returned in the body too so the client can attach it to impression
// reports.
export async function GET(req: Request): Promise<NextResponse> {
  const { deviceId, minted } = readOrMintDeviceId(req)
  const session = await getSession().catch(() => null)

  const url = new URL(req.url)
  const cursorParam = url.searchParams.get("cursor")
  const limitParam = url.searchParams.get("limit")
  const cursor = cursorParam ? Number(cursorParam) : undefined
  const limit = limitParam ? Number(limitParam) : undefined
  if ((cursorParam && !Number.isInteger(cursor)) || (limitParam && !Number.isInteger(limit))) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "cursor and limit must be integers" }, { status: 400 })
  }

  const page = await getFeedPage({
    deviceId,
    viewerUserId: session?.userId,
    cursor: cursor,
    limit: limit,
  })

  // A feed request is the clearest "audience is online now" signal — feeds the
  // peak-hours heatmap. Only count fresh loads (first page), not pagination.
  if (!cursor) void recordActivity()

  const res = NextResponse.json({ data: { ...page, deviceId } })
  return minted ? setDeviceCookie(res, deviceId) : res
}
