import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { resendOnboardingCodes } from "@/lib/services/advertiser-onboarding"

export async function POST(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  await resendOnboardingCodes(session.userId)
  return NextResponse.json({ data: { ok: true } })
}
