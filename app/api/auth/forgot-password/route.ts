import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendPasswordResetCode } from "@/lib/auth/email"
import { checkRateLimit } from "@/lib/rateLimit"
import { z } from "zod"

const schema = z.object({ email: z.string().min(1) })

export async function POST(req: Request) {
  try {
    let body: unknown
    try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

    const parsed = schema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Email required" }, { status: 400 })

    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true, deleted_at: true },
    })

    if (!user || user.deleted_at) {
      return NextResponse.json({ error: "No account found with that email" }, { status: 404 })
    }

    // Guards against double-submit the same way resend-code does — two
    // near-simultaneous sends would each delete-then-recreate the code, so
    // whichever email the user actually got might already be invalidated.
    const rl = checkRateLimit(`forgot-password:${user.id}`, { windowMs: 30_000, max: 1 })
    if (!rl.allowed) {
      return NextResponse.json({ error: "Please wait a moment before requesting another code" }, { status: 429 })
    }

    try {
      await sendPasswordResetCode(user.id, parsed.data.email)
    } catch (err) {
      console.error("Failed to send password reset code:", err)
      return NextResponse.json({ error: "Failed to send code — try again" }, { status: 500 })
    }

    return NextResponse.json({ userId: user.id })
  } catch (err) {
    console.error("Forgot password error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
