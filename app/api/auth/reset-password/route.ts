import { NextResponse } from "next/server"
import { verifySigninCode } from "@/lib/auth/email"
import { hashPassword } from "@/lib/auth/password"
import { createSession, applySessionCookie } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { notifyPasswordChanged } from "@/lib/services/security-notify"
import { prisma } from "@/lib/db"
import { z } from "zod"

const schema = z.object({
  userId: z.number().int().positive(),
  code: z.string().length(6),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(req: Request) {
  try {
    let body: unknown
    try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
    }

    const { userId, code, new_password } = parsed.data
    const valid = await verifySigninCode(userId, code)
    if (!valid) return NextResponse.json({ error: "Invalid or expired code" }, { status: 400 })

    const password_hash = await hashPassword(new_password)
    await prisma.user.update({ where: { id: userId }, data: { password_hash } })

    // A password reset means the account may have been compromised or the
    // old password leaked — sign out every existing session, not just stale ones.
    await prisma.session.deleteMany({ where: { user_id: userId } })
    await notifyPasswordChanged(userId)

    const { token, expires_at } = await createSession(userId)
    const res = NextResponse.json({ ok: true, isAdmin: isAdmin(userId) })
    return applySessionCookie(res, token, expires_at)
  } catch (err) {
    console.error("Reset password error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
