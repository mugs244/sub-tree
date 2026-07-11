import { NextResponse } from "next/server"
import { verifySigninCode } from "@/lib/auth/email"
import { createSession, applySessionCookie } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { z } from "zod"

const schema = z.object({
  userId: z.number().int().positive(),
  code: z.string().length(6),
})

export async function POST(req: Request) {
  try {
    let body: unknown
    try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 })

    const { userId, code } = parsed.data
    const valid = await verifySigninCode(userId, code)
    if (!valid) return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })

    const { token, expires_at } = await createSession(userId)
    const res = NextResponse.json({ ok: true, isAdmin: isAdmin(userId) })
    return applySessionCookie(res, token, expires_at)
  } catch (err) {
    console.error("Verify signin OTP error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
