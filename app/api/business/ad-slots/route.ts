import { NextResponse } from "next/server"
import { AdSlotDurationType } from "@prisma/client"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { listSlotCalendar, bookAdSlot, AdSlotError } from "@/lib/services/ad-slots"

const DURATION_TYPES = new Set(Object.values(AdSlotDurationType))

// GET /api/business/ad-slots?from=ISO&to=ISO — the shared calendar/timetable
// view. Every advertiser sees the same inventory (taken vs. open), not just
// their own bookings, since booking a window depends on what else is live.
export async function GET(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  const url = new URL(req.url)
  const fromParam = url.searchParams.get("from")
  const toParam = url.searchParams.get("to")
  const from = fromParam ? new Date(fromParam) : new Date()
  const to = toParam ? new Date(toParam) : new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000)

  if (isNaN(from.getTime()) || isNaN(to.getTime())) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid from/to date" }, { status: 400 })
  }

  const bookings = await listSlotCalendar(from, to)
  return NextResponse.json({ data: bookings, viewerAdvertiserId: advertiser.id })
}

// POST /api/business/ad-slots — buy a slot (wallet deduction). Content is
// uploaded later in the editor — this only reserves the window.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const { startsAt, endsAt, durationType } = (body ?? {}) as {
    startsAt?: string
    endsAt?: string
    durationType?: string
  }

  if (!startsAt || !endsAt || !durationType || !DURATION_TYPES.has(durationType as AdSlotDurationType)) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "startsAt, endsAt and a valid durationType are required" }, { status: 400 })
  }

  try {
    const result = await bookAdSlot({
      advertiserId: advertiser.id,
      userId: session.userId,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      durationType: durationType as AdSlotDurationType,
    })
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    if (err instanceof AdSlotError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
