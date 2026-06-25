import { Resend } from "resend"
import { prisma } from "@/lib/db"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Sub-tree <noreply@sub-tree.com>"
const CODE_TTL_MINUTES = 15

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function sendVerificationEmail(userId: number, email: string): Promise<void> {
  const code = generateCode()
  const expires_at = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000)

  await prisma.emailVerification.deleteMany({ where: { user_id: userId } })
  await prisma.emailVerification.create({ data: { user_id: userId, code, expires_at } })

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `${code} — your Sub-tree verification code`,
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 8px">Verify your email</h2>
        <p style="color:#6b7280;margin:0 0 24px">Enter this code in Sub-tree to continue:</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;font-family:monospace;margin-bottom:24px">${code}</div>
        <p style="color:#6b7280;font-size:13px">Expires in ${CODE_TTL_MINUTES} minutes. If you didn't request this, ignore this email.</p>
      </div>
    `,
  })
}

export async function verifyCode(userId: number, code: string): Promise<boolean> {
  const record = await prisma.emailVerification.findFirst({
    where: { user_id: userId, code },
  })
  if (!record) return false
  if (record.expires_at < new Date()) return false

  await prisma.emailVerification.deleteMany({ where: { user_id: userId } })
  await prisma.user.update({
    where: { id: userId },
    data: { email_verified_at: new Date() },
  })
  return true
}
