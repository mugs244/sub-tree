import { Resend } from "resend"
import { prisma } from "@/lib/db"
import { generateCode } from "@/lib/auth/email"
import { sendSms } from "@/lib/sms"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Sub-tree <hello@sub-tree.com>"
const CODE_TTL_MINUTES = 10

// What a code authorises. A code is only ever accepted for the purpose it
// was sent for, so a bank-details code can't approve a withdrawal.
export type OtpPurpose = "WITHDRAWAL" | "BANK_DETAILS"
export type OtpChannel = "email" | "sms"

export class WithdrawalOtpError extends Error {
  constructor(
    public readonly code: "NO_EMAIL" | "NO_PHONE" | "INVALID_CODE",
    message: string,
  ) {
    super(message)
    this.name = "WithdrawalOtpError"
  }
}

async function issueCode(userId: number, purpose: OtpPurpose): Promise<string> {
  const code = generateCode()
  const expires_at = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000)
  // One active code per user and purpose — a new one invalidates the last.
  await prisma.withdrawalOtp.deleteMany({ where: { user_id: userId, purpose, consumed_at: null } })
  await prisma.withdrawalOtp.create({ data: { user_id: userId, code, expires_at, purpose } })
  return code
}

function codeEmail(name: string, intro: string, code: string): string {
  return `
    <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px">
      <p>Hi ${name},</p>
      <p style="color:#374151">${intro}</p>
      <div style="font-size:36px;font-weight:700;letter-spacing:8px;font-family:monospace;text-align:center;margin:24px 0">${code}</div>
      <p style="font-weight:600;margin-bottom:4px">Security notice:</p>
      <ul style="color:#374151;font-size:14px;padding-left:20px;margin-top:4px">
        <li>This code expires in ${CODE_TTL_MINUTES} minutes.</li>
        <li><strong>Do not share this code with anyone.</strong> Sub-tree staff will never ask you for it.</li>
      </ul>
      <p style="color:#dc2626;font-size:13px;margin-top:16px">If you didn't request this, change your password immediately and reply to this email to alert our team.</p>
      <p style="margin-top:24px">The Sub-tree team</p>
    </div>
  `
}

// Withdrawal approval code, sent by email or SMS — the creator's choice.
// SMS goes to the account's own phone, never to the payout destination.
export async function sendWithdrawalOtp(userId: number, amountUgx: number, channel: OtpChannel = "email"): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, phone: true, username: true, profile: { select: { display_name: true } } },
  })
  if (channel === "sms" && !user?.phone) throw new WithdrawalOtpError("NO_PHONE", "No phone number on this account")
  if (channel === "email" && !user?.email) throw new WithdrawalOtpError("NO_EMAIL", "No email on file for this account")

  const code = await issueCode(userId, "WITHDRAWAL")
  const amount = `UGX ${Math.round(amountUgx).toLocaleString()}`

  if (channel === "sms") {
    await sendSms(user!.phone!, `Sub-tree: ${code} is your code to withdraw ${amount}. Expires in ${CODE_TTL_MINUTES} min. Never share it.`)
    return
  }

  const name = user!.profile?.display_name ?? user!.username ?? "there"
  await resend.emails.send({
    from: FROM,
    to: user!.email,
    subject: "Your Sub-tree withdrawal code",
    html: codeEmail(name, `Use this code to approve your withdrawal of <strong>${amount}</strong>:`, code),
  })
}

// Code for saving or changing bank details — always by email.
export async function sendBankDetailsOtp(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, username: true, profile: { select: { display_name: true } } },
  })
  if (!user?.email) throw new WithdrawalOtpError("NO_EMAIL", "No email on file for this account")

  const code = await issueCode(userId, "BANK_DETAILS")
  const name = user.profile?.display_name ?? user.username ?? "there"
  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: "Confirm your Sub-tree bank details",
    html: codeEmail(name, "Use this code to save the bank account your withdrawals will be sent to:", code),
  })
}

export async function verifyWithdrawalOtp(userId: number, code: string, purpose: OtpPurpose = "WITHDRAWAL"): Promise<void> {
  const record = await prisma.withdrawalOtp.findFirst({
    where: { user_id: userId, code, purpose, consumed_at: null },
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
