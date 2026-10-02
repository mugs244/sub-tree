import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { verifyWithdrawalOtp, WithdrawalOtpError } from "@/lib/services/withdrawal-otp"
import { notifyEmailChanged } from "@/lib/services/security-notify"

const schema = z.object({
  new_email: z.string().trim().toLowerCase().email(),
  code: z.string().length(6),
})

// Step 2: the code proves the creator owns the new address. Save it, sign
// out every other device, and tell the old address.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Enter the 6-digit code" }, { status: 400 })
  }
  const { new_email, code } = parsed.data

  try {
    await verifyWithdrawalOtp(session.userId, code, `EMAIL_CHANGE:${new_email}`)
  } catch (err) {
    if (err instanceof WithdrawalOtpError) {
      return NextResponse.json({ error: err.code, message: err.message }, { status: 400 })
    }
    throw err
  }

  // Re-check: someone could have taken the address since the code was sent.
  const taken = await prisma.user.findFirst({
    where: { email: { equals: new_email, mode: "insensitive" }, id: { not: session.userId } },
    select: { id: true },
  })
  if (taken) {
    return NextResponse.json({ error: "EMAIL_TAKEN", message: "Another account already uses that email" }, { status: 409 })
  }

  const before = await prisma.user.findUniqueOrThrow({ where: { id: session.userId }, select: { email: true } })
  await prisma.user.update({
    where: { id: session.userId },
    data: { email: new_email, email_verified_at: new Date() },
  })

  const currentToken = (await cookies()).get("st_session")?.value
  await prisma.session.deleteMany({
    where: { user_id: session.userId, ...(currentToken ? { token: { not: currentToken } } : {}) },
  })

  await notifyEmailChanged(session.userId, before.email, new_email)
  return NextResponse.json({ data: { email: new_email } })
}
