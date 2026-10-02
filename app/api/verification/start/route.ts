import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { checkRateLimit } from "@/lib/rateLimit"
import { startVerification, VerificationError } from "@/lib/services/verification"
import { WithdrawalOtpError } from "@/lib/services/withdrawal-otp"

// Step 1: email a code to the account email.
export async function POST(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const rl = checkRateLimit(`verification-start:${session.userId}`, { windowMs: 30_000, max: 1 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "RATE_LIMITED", message: "Please wait a moment before asking for another code" }, { status: 429 })
  }

  try {
    await startVerification(session.userId)
    return NextResponse.json({ data: null })
  } catch (err) {
    if (err instanceof VerificationError || err instanceof WithdrawalOtpError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }
}
