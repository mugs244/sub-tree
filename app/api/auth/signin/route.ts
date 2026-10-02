import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verifyPassword } from "@/lib/auth/password"
import { createSession, applySessionCookie } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { notifyNewSignIn } from "@/lib/services/security-notify"
import { getLoginContext } from "@/lib/auth/login-context"
import { checkRateLimit } from "@/lib/rateLimit"
import { z } from "zod"

const schema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    let body: unknown
    try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 })
    }

    const { email, password } = parsed.data

    // Slow down password guessing: 10 tries per 15 minutes per email.
    // (In-memory per server instance — a speed bump, not a hard lock.)
    const rl = checkRateLimit(`signin:${email.trim().toLowerCase()}`, { windowMs: 15 * 60 * 1000, max: 10 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many sign-in attempts. Please wait a few minutes or sign in with a code." }, { status: 429 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password_hash: true, email_verified_at: true, deleted_at: true },
    })

    const INVALID = NextResponse.json({ error: "Invalid email or password" }, { status: 401 })

    if (!user || user.deleted_at) return INVALID
    if (!user.password_hash) return INVALID
    const match = await verifyPassword(password, user.password_hash)
    if (!match) return INVALID

    if (!user.email_verified_at) {
      return NextResponse.json({ error: "Please verify your email before signing in", unverified: true, userId: user.id }, { status: 403 })
    }

    const { token, expires_at } = await createSession(user.id)
    await notifyNewSignIn(user.id, getLoginContext(req.headers), "Password")
    const res = NextResponse.json({ ok: true, isAdmin: isAdmin(user.id) })
    return applySessionCookie(res, token, expires_at)
  } catch (err) {
    console.error("Signin error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
