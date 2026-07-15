import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { hashPassword } from "@/lib/auth/password"
import { sendVerificationEmail } from "@/lib/auth/email"
import { recordTermsAcceptance } from "@/lib/services/terms-acceptance"
import { getIpFromHeaders } from "@/lib/utils/geo"
import { z } from "zod"

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  agreedToTerms: z.literal(true, {
    message: "You must agree to the Terms of Service",
  }),
})

export async function POST(req: Request) {
  try {
    let body: unknown
    try { body = await req.json() } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
    }

    const { email, password } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const password_hash = await hashPassword(password)
    const user = await prisma.user.create({
      data: { email, password_hash },
      select: { id: true },
    })

    await recordTermsAcceptance(user.id, getIpFromHeaders(req.headers))

    try {
      await sendVerificationEmail(user.id, email)
    } catch (err) {
      console.error("Failed to send verification email:", err)
    }

    return NextResponse.json({ userId: user.id }, { status: 201 })
  } catch (err) {
    console.error("Signup error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
