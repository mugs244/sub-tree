import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { bookAdSlotReruns, estimateRerunCost, AdSlotError } from "@/lib/services/ad-slots"

// Ticking daily/weekly rerun checkboxes on the calendar should show the total
// before payment — this endpoint is the "show total" half; POST is "pay now".
export async function GET(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const url = new URL(req.url)
  const dates = url.searchParams.getAll("date").map((d) => new Date(d))
  if (dates.length === 0 || dates.some((d) => isNaN(d.getTime()))) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Provide one or more valid ?date= values" }, { status: 400 })
  }

  const totalUgx = await estimateRerunCost(dates)
  return NextResponse.json({ data: { totalUgx, days: dates.length } })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> },
): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  const { bookingId } = await params
  const bookingIdNum = Number(bookingId)
  if (!Number.isInteger(bookingIdNum)) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid booking id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const { rerunDates } = (body ?? {}) as { rerunDates?: string[] }
  if (!Array.isArray(rerunDates) || rerunDates.length === 0) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "rerunDates must be a non-empty array" }, { status: 400 })
  }

  const parsed = rerunDates.map((d) => new Date(d))
  if (parsed.some((d) => isNaN(d.getTime()))) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "One or more rerunDates is not a valid date" }, { status: 400 })
  }

  try {
    const result = await bookAdSlotReruns({ advertiserId: advertiser.id, bookingId: bookingIdNum, rerunDates: parsed })
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    if (err instanceof AdSlotError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
