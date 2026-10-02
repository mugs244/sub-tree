import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { checkRateLimit } from "@/lib/rateLimit"
import { openSession, VerificationError } from "@/lib/services/verification"
import { WithdrawalOtpError } from "@/lib/services/withdrawal-otp"
import { SMILE_COUNTRY, SMILE_ID_TYPE, SMILE_SDK_PRODUCT, SMILE_SDK_SCRIPT } from "@/lib/services/smile-id"

const schema = z.object({ code: z.string().length(6) })

// Step 2: check the emailed code, start an attempt, and hand the browser
// what it needs to open Smile ID's capture widget.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR", message: "Enter the 6-digit code" }, { status: 400 })

  const rl = checkRateLimit(`verification-session:${session.userId}`, { windowMs: 15 * 60 * 1000, max: 8 })
  if (!rl.allowed) return NextResponse.json({ error: "RATE_LIMITED", message: "Too many attempts. Please wait a few minutes." }, { status: 429 })

  const callbackUrl = `${new URL(req.url).origin}/api/webhooks/smile-id`
  try {
    const s = await openSession(session.userId, parsed.data.code, callbackUrl)
    return NextResponse.json({
      data: {
        token: s.token,
        partnerId: s.partnerId,
        sandbox: s.sandbox,
        smileUserId: s.smileUserId,
        product: SMILE_SDK_PRODUCT,
        script: SMILE_SDK_SCRIPT,
        callbackUrl,
        country: SMILE_COUNTRY,
        idType: SMILE_ID_TYPE,
      },
    })
  } catch (err) {
    if (err instanceof VerificationError || err instanceof WithdrawalOtpError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    console.error("Verification session failed", err)
    return NextResponse.json({ error: "SMILE_ERROR", message: "Could not start the identity check. Please try again shortly." }, { status: 502 })
  }
}
