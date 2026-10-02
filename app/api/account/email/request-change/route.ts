import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { verifyPassword } from "@/lib/auth/password"
import { checkRateLimit } from "@/lib/rateLimit"
import { sendEmailChangeCode } from "@/lib/services/withdrawal-otp"

const schema = z.object({
  new_email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your current password"),
})

// Step 1 of changing the account email: check the current password, make
// sure the new address is free, then send a code to the new address.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
  }
  const { new_email, password } = parsed.data

  const rl = checkRateLimit(`email-change:${session.userId}`, { windowMs: 15 * 60 * 1000, max: 5 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "RATE_LIMITED", message: "Too many attempts. Please wait a few minutes." }, { status: 429 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true, password_hash: true } })
  if (!user?.password_hash) {
    return NextResponse.json(
      { error: "NO_PASSWORD_SET", message: "Set a password first (use \"Forgot password\"), then you can change your email." },
      { status: 400 },
    )
  }
  if (!(await verifyPassword(password, user.password_hash))) {
    return NextResponse.json({ error: "INCORRECT_PASSWORD", message: "Current password is incorrect" }, { status: 400 })
  }
  if (new_email === user.email.toLowerCase()) {
    return NextResponse.json({ error: "SAME_EMAIL", message: "That's already your email" }, { status: 400 })
  }

  const taken = await prisma.user.findFirst({
    where: { email: { equals: new_email, mode: "insensitive" }, id: { not: session.userId } },
    select: { id: true },
  })
  if (taken) {
    return NextResponse.json({ error: "EMAIL_TAKEN", message: "Another account already uses that email" }, { status: 409 })
  }

  await sendEmailChangeCode(session.userId, new_email)
  return NextResponse.json({ data: null })
}
