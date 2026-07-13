import { prisma } from "@/lib/db"
import { sendSms } from "@/lib/sms"
import { generateCode } from "@/lib/auth/email"

const CODE_TTL_MINUTES = 15

// Keyed by (user_id, phone) — see PhoneVerification's schema comment. Reused
// for onboarding's donation-number verification and settings' phone/
// donation-number change flows; the caller decides what to do once verified.
export async function sendPhoneVerificationCode(userId: number, phone: string): Promise<void> {
  const code = generateCode()
  const expires_at = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000)

  await prisma.phoneVerification.deleteMany({ where: { user_id: userId, phone } })
  await prisma.phoneVerification.create({ data: { user_id: userId, phone, code, expires_at } })

  await sendSms(phone, `${code} is your Sub-tree verification code. Expires in ${CODE_TTL_MINUTES} minutes.`)
}

export async function verifyPhoneCode(userId: number, phone: string, code: string): Promise<boolean> {
  const record = await prisma.phoneVerification.findFirst({ where: { user_id: userId, phone, code } })
  if (!record) return false
  if (record.expires_at < new Date()) return false

  await prisma.phoneVerification.deleteMany({ where: { user_id: userId, phone } })
  return true
}
