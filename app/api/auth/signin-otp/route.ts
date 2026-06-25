import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendSigninCode } from "@/lib/auth/email"
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

    try {
      await sendSigninCode(user.id, parsed.data.email)
    } catch (err) {
      console.error("Failed to send signin code:", err)
      return NextResponse.json({ error: "Failed to send code — try again" }, { status: 500 })
    }

    return NextResponse.json({ userId: user.id })
  } catch (err) {
    console.error("Signin OTP error:", err)
    return NextResponse.json({ error: "Internal server error", detail: String(err) }, { status: 500 })
  }
}
