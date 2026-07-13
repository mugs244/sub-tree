import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { ugandaPhoneRegex } from "@/lib/validators/profile"
import { sendPhoneVerificationCode } from "@/lib/services/phone-verification"
import { checkRateLimit } from "@/lib/rateLimit"

const schema = z.object({
  phone: z.string().regex(ugandaPhoneRegex, "Enter a valid Uganda mobile number (e.g. 0771234567)"),
})

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    )
  }

  const rl = checkRateLimit(`phone-code:${session.userId}`, { windowMs: 10 * 60 * 1000, max: 5 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many code requests. Please wait a few minutes and try again." },
      { status: 429 },
    )
  }

  await sendPhoneVerificationCode(session.userId, parsed.data.phone)
  return NextResponse.json({ data: null })
}
