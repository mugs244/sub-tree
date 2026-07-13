import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { ugandaPhoneRegex } from "@/lib/validators/profile"
import { requestNumberChange, NumberChangeError } from "@/lib/services/number-change"
import { checkRateLimit } from "@/lib/rateLimit"

const schema = z.object({
  new_phone: z.string().regex(ugandaPhoneRegex, "Enter a valid Uganda mobile number (e.g. 0771234567)"),
  channel: z.enum(["sms", "email"]),
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

  const rl = checkRateLimit(`number-change:${session.userId}`, { windowMs: 10 * 60 * 1000, max: 5 })
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMITED", message: "Too many code requests. Please wait a few minutes and try again." },
      { status: 429 },
    )
  }

  try {
    await requestNumberChange(session.userId, parsed.data.new_phone, parsed.data.channel)
  } catch (err) {
    if (err instanceof NumberChangeError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }

  return NextResponse.json({ data: null })
}
