import { Resend } from "resend"
import { prisma } from "@/lib/db"
import { generateCode } from "@/lib/auth/email"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Sub-tree <onboarding@resend.dev>"
const CODE_TTL_MINUTES = 10

export class WithdrawalOtpError extends Error {
  constructor(
    public readonly code: "NO_EMAIL" | "INVALID_CODE",
    message: string,
  ) {
    super(message)
    this.name = "WithdrawalOtpError"
  }
}

// One active code per user at a time — requesting a new one invalidates any
// unused withdrawal code, but never touches EmailVerification (signup/signin).
export async function sendWithdrawalOtp(userId: number, amountUgx: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, username: true, profile: { select: { display_name: true } } },
  })
  if (!user?.email) throw new WithdrawalOtpError("NO_EMAIL", "No email on file for this account")

  const name = user.profile?.display_name ?? user.username ?? "there"
  const code = generateCode()
  const expires_at = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000)

  await prisma.withdrawalOtp.deleteMany({ where: { user_id: userId, consumed_at: null } })
  await prisma.withdrawalOtp.create({ data: { user_id: userId, code, expires_at } })

  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: `Action Required: Verification Code for Your Sub-tree Withdrawal 🔒`,
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px">
        <p>Hi ${name},</p>
        <p style="color:#374151">You recently initiated a withdrawal of <strong>UGX ${Math.round(amountUgx).toLocaleString()}</strong> from your Sub-tree account. To authorize and complete this request, please use the 6-digit confirmation code below:</p>
        <div style="font-size:36px;font-weight:700;letter-spacing:8px;font-family:monospace;text-align:center;margin:24px 0">${code}</div>
        <p style="font-weight:600;margin-bottom:4px">Security Notice:</p>
        <ul style="color:#374151;font-size:14px;padding-left:20px;margin-top:4px">
          <li>This code will expire in ${CODE_TTL_MINUTES} minutes.</li>
          <li><strong>Do not share this code with anyone.</strong> Sub-tree staff will never ask you for this code over the phone, text, or email.</li>
        </ul>
        <p style="color:#dc2626;font-size:13px;margin-top:16px">If you did not request this withdrawal, please change your password immediately and reply to this email to alert our security team.</p>
        <p style="margin-top:24px">Best regards,<br/><strong>The Sub-tree Team</strong></p>
      </div>
    `,
  })
}

export async function verifyWithdrawalOtp(userId: number, code: string): Promise<void> {
  const record = await prisma.withdrawalOtp.findFirst({
    where: { user_id: userId, code, consumed_at: null },
    orderBy: { created_at: "desc" },
  })

  if (!record || record.expires_at < new Date()) {
    throw new WithdrawalOtpError("INVALID_CODE", "Invalid or expired code")
  }

  await prisma.withdrawalOtp.update({
    where: { id: record.id },
    data: { consumed_at: new Date() },
  })
}
