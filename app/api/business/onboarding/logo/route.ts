import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getAdvertiserForUser } from "@/lib/services/advertiser"
import { setOnboardingLogo, OnboardingError } from "@/lib/services/advertiser-onboarding"

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const advertiser = await getAdvertiserForUser(session.userId)
  if (!advertiser) return NextResponse.json({ error: "NOT_ADVERTISER", message: "No business account found" }, { status: 403 })

  const { logoUrl } = ((await req.json().catch(() => ({}))) ?? {}) as { logoUrl?: string }
  if (typeof logoUrl !== "string") {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "logoUrl is required" }, { status: 400 })
  }

  try {
    const result = await setOnboardingLogo(advertiser.id, logoUrl)
    return NextResponse.json({ data: result })
  } catch (err) {
    if (err instanceof OnboardingError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
