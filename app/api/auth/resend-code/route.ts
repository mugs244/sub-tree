import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendVerificationEmail } from "@/lib/auth/email"
import { checkRateLimit } from "@/lib/rateLimit"
import { z } from "zod"

const schema = z.object({ userId: z.number().int().positive() })

export async function POST(req: Request) {
  let body: unknown
  try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

  // Guards against double-submit (a fast double-click/double-tap can fire two
  // overlapping requests) — without this, two near-simultaneous sends each
  // delete-then-recreate the verification code, so the earlier email's code
  // silently stops working even though it was already delivered.
  const rl = checkRateLimit(`resend-code:${parsed.data.userId}`, { windowMs: 30_000, max: 1 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "Please wait a moment before requesting another code" }, { status: 429 })
  }

  const user = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { email: true, email_verified_at: true },
  })
  if (!user || user.email_verified_at) {
    return NextResponse.json({ error: "Not applicable" }, { status: 400 })
  }

  await sendVerificationEmail(parsed.data.userId, user.email)
  return NextResponse.json({ ok: true })
}
