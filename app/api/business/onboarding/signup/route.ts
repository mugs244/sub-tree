import { NextResponse } from "next/server"
import { signupAdvertiser, OnboardingError } from "@/lib/services/advertiser-onboarding"
import { createSession, applySessionCookie } from "@/lib/auth/session"

// Public — standalone company signup. Creates the account and signs them in so
// the remaining onboarding steps (verify email/phone, logo, pay) are
// authenticated. Email isn't verified yet; a session is minted directly here
// rather than through the normal sign-in path, which gates on verification.
export async function POST(req: Request): Promise<NextResponse> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const b = (body ?? {}) as Record<string, unknown>
  const str = (v: unknown) => (typeof v === "string" ? v : "")

  try {
    const { userId, advertiserId } = await signupAdvertiser({
      companyName: str(b.companyName),
      email: str(b.email),
      password: str(b.password),
      phone: str(b.phone),
      tin: str(b.tin),
      plan: str(b.plan),
    })
    const { token, expires_at } = await createSession(userId)
    const res = NextResponse.json({ data: { userId, advertiserId } }, { status: 201 })
    return applySessionCookie(res, token, expires_at)
  } catch (err) {
    if (err instanceof OnboardingError) {
      const status = err.code === "EMAIL_TAKEN" ? 409 : 400
      return NextResponse.json({ error: err.code, message: err.message }, { status })
    }
    throw err
  }
}
