import { Resend } from "resend"
import { prisma } from "@/lib/db"
import { sendSms } from "@/lib/sms"
import { generateCode } from "@/lib/auth/email"
import { sendPhoneVerificationCode, verifyPhoneCode } from "@/lib/services/phone-verification"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Sub-tree <hello@sub-tree.com>"
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

  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `${code} — confirm your new Sub-tree number`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px">Confirm your new number</h2>
        <p style="color:#6b7280;margin:0 0 24px">Enter this code in Sub-tree to confirm ${newNumber}:</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;font-family:monospace;margin-bottom:24px">${code}</div>
        <p style="color:#6b7280;font-size:13px">Expires in ${CODE_TTL_MINUTES} minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
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

  // Confirm on both channels regardless of which one delivered the code.
  await sendSms(newNumber, `Sub-tree: Your ${label} is now confirmed and saved.`)

  if (user?.email) {
    try {
      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: `Your Sub-tree ${label} was changed`,
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px">
            <h2 style="margin:0 0 8px">Your ${label} was changed</h2>
            <p style="color:#374151">Your ${label} is now <strong>${newNumber}</strong>.</p>
            <p style="color:#dc2626;font-size:13px;margin-top:16px">If you didn't make this change, contact support immediately.</p>
          </div>
        `,
      })
    } catch (err) {
      console.error(`${kind} change email failed`, { userId, err })
    }
  }
}
