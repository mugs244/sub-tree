import { NextResponse } from "next/server"
import { AdFormat } from "@prisma/client"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { saveAdCreative, AdSlotError } from "@/lib/services/ad-slots"

const AD_FORMATS = new Set(Object.values(AdFormat))

export async function PUT(
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

  const { format, mediaUrl, logoUrl, appUrl, websiteUrl, productName, productDesc } = (body ?? {}) as Record<string, unknown>

  if (typeof format !== "string" || !AD_FORMATS.has(format as AdFormat)) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "A valid format is required" }, { status: 400 })
  }

  try {
    const result = await saveAdCreative(advertiser.id, bookingIdNum, {
      format: format as AdFormat,
      mediaUrl: typeof mediaUrl === "string" ? mediaUrl : undefined,
      logoUrl: typeof logoUrl === "string" ? logoUrl : undefined,
      appUrl: typeof appUrl === "string" ? appUrl : undefined,
      websiteUrl: typeof websiteUrl === "string" ? websiteUrl : undefined,
      productName: typeof productName === "string" ? productName : undefined,
      productDesc: typeof productDesc === "string" ? productDesc : undefined,
    })
    return NextResponse.json({ data: result })
  } catch (err) {
    if (err instanceof AdSlotError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.code === "NOT_FOUND" ? 404 : 400 })
    }
    throw err
  }
}
