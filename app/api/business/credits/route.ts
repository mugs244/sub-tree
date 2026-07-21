import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { buyCredits, AdvertiserCreditError } from "@/lib/services/advertiser-credits"

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  // Spending the wallet is billing — restrict to OWNER/ADMIN, same line the
  // Team roles draw (EDITORs manage creatives but don't spend).
  if (advertiser.role === "EDITOR") {
    return NextResponse.json({ error: "FORBIDDEN", message: "Editors can't buy credits" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const { quantity } = (body ?? {}) as { quantity?: number }
  if (typeof quantity !== "number") {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "quantity must be a number" }, { status: 400 })
  }

  try {
    const result = await buyCredits(advertiser.id, quantity)
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (err) {
    if (err instanceof AdvertiserCreditError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
