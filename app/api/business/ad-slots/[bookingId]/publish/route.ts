import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { publishAdSlot, AdSlotError } from "@/lib/services/ad-slots"

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

  try {
    await publishAdSlot(advertiser.id, bookingIdNum)
    return NextResponse.json({ data: { published: true } })
  } catch (err) {
    if (err instanceof AdSlotError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.code === "NOT_FOUND" ? 404 : 400 })
    }
    throw err
  }
}
