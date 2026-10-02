import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email/send"
import { sendSms } from "@/lib/sms"
import { generateCode } from "@/lib/auth/email"
import { sendPhoneVerificationCode, verifyPhoneCode } from "@/lib/services/phone-verification"
import { emailLayout, heading, p, codeBox, strong, notice } from "@/lib/email/template"

const CODE_TTL_MINUTES = 15

export type NumberKind = "phone" | "momo_number"

const KIND_LABEL: Record<NumberKind, string> = {
  phone: "phone number",
  momo_number: "donation number",
}

export class NumberChangeError extends Error {
  constructor(
    public readonly code: "NO_EMAIL" | "INVALID_CODE",
    message: string,
  ) {
    super(message)
    this.name = "NumberChangeError"
  }
}

export async function requestNumberChange(
  userId: number,
  newNumber: string,
  channel: "sms" | "email",
): Promise<void> {
  if (channel === "sms") {
    await sendPhoneVerificationCode(userId, newNumber)
    return
  }

  // Email channel — the code is still scoped to the new number (so
  // confirmNumberChange can verify it the same way regardless of delivery
  // channel), just delivered to the account's own email instead of it.
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (!user?.email) throw new NumberChangeError("NO_EMAIL", "No email on file to send a code to")

  const code = generateCode()
  const expires_at = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000)
  await prisma.phoneVerification.deleteMany({ where: { user_id: userId, phone: newNumber } })
  await prisma.phoneVerification.create({ data: { user_id: userId, phone: newNumber, code, expires_at } })

  await sendEmail({
    to: user.email,
    subject: `${code} — confirm your new Sub-tree number`,
    html: emailLayout({
      preheader: `Your code to confirm ${newNumber} is ${code}`,
      body: heading("Confirm your new number") + p(`Enter this code in Sub-tree to confirm ${strong(newNumber)}:`, { html: true }) + codeBox(code, CODE_TTL_MINUTES) + p("If you didn't request this, you can ignore this email.", { muted: true, size: 13 }),
    }),
  })
}

export async function confirmNumberChange(
  userId: number,
  kind: NumberKind,
  newNumber: string,
  code: string,
): Promise<void> {
  const valid = await verifyPhoneCode(userId, newNumber, code)
  if (!valid) throw new NumberChangeError("INVALID_CODE", "Invalid or expired code")

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, momo_number: true, email: true },
  })
  const oldNumber = kind === "phone" ? user?.phone : user?.momo_number

  await prisma.user.update({
    where: { id: userId },
    data:
      kind === "phone"
        ? { phone: newNumber, phone_verified_at: new Date() }
        : { momo_number: newNumber, momo_number_verified_at: new Date() },
  })

  const label = KIND_LABEL[kind]

  // Anti-takeover: warn the OLD number too, if one existed and differs.
  if (oldNumber && oldNumber !== newNumber) {
    await sendSms(oldNumber, `Sub-tree: Your ${label} was changed. If this wasn't you, contact support immediately.`)
  }


  if (user?.email) await emailNumberChanged(user.email, kind, newNumber)
}

// Exported for the admin email tester.
export async function emailNumberChanged(email: string, kind: NumberKind, newNumber: string): Promise<void> {
  const label = KIND_LABEL[kind]
  await sendEmail({
    to: email,
    subject: `Your Sub-tree ${label} was changed`,
    html: emailLayout({
      preheader: `Your ${label} is now ${newNumber}`,
      body: heading(`Your ${label} was changed`) + p(`Your ${label} is now ${strong(newNumber)}.`, { html: true }) + notice("If you didn't make this change, contact support immediately by replying to this email.", "danger"),
    }),
  })
}
