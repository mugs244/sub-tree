import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { payOnboardingSubscription } from "@/lib/services/advertiser-onboarding"
import { AdvertiserPaymentError } from "@/lib/services/advertiser-payment"

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  const { phone } = ((await req.json().catch(() => ({}))) ?? {}) as { phone?: string }

  try {
    const result = await payOnboardingSubscription(advertiser.id, typeof phone === "string" ? phone : undefined)
    return NextResponse.json({ data: result }, { status: 202 })
  } catch (err) {
    if (err instanceof AdvertiserPaymentError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: err.code === "NOT_CONFIGURED" ? 503 : 400 })
    }
    throw err
  }
}
