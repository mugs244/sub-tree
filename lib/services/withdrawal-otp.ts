import { Resend } from "resend"
import { prisma } from "@/lib/db"
import { generateCode } from "@/lib/auth/email"
import { sendSms } from "@/lib/sms"
import { emailLayout, greeting, p, codeBox, notice, securityNote, strong } from "@/lib/email/template"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Sub-tree <hello@sub-tree.com>"
const CODE_TTL_MINUTES = 10

// What a code authorises. A code is only ever accepted for the purpose it
// was sent for, so a bank-details code can't approve a withdrawal.
// EMAIL_CHANGE carries the new address, so a code only confirms the exact
// email it was sent to.
export type OtpPurpose = "WITHDRAWAL" | "BANK_DETAILS" | "VERIFICATION" | `EMAIL_CHANGE:${string}`
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

// `intro` may contain markup built by the caller (e.g. <strong>); `name`
// is user-provided and escaped by greeting().
function codeEmail(name: string, intro: string, code: string, preheader: string): string {
  return emailLayout({
    preheader,
    body:
      greeting(name) +
      p(intro, { html: true }) +
      codeBox(code, CODE_TTL_MINUTES) +
      notice("Never share this code. Sub-tree staff will never ask you for it — not by phone, text or email.") +
      securityNote(),
  })
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
    html: codeEmail(name, `Use this code to approve your withdrawal of ${strong(amount)}:`, code, `Your code to approve a ${amount} withdrawal`),
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
    html: codeEmail(name, "Use this code to save the bank account your withdrawals will be sent to:", code, "Your code to confirm your bank details"),
  })
}

// Code for changing the account email — sent to the NEW address, proving
// the creator owns it. The caller has already checked their password.
export async function sendEmailChangeCode(userId: number, newEmail: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, profile: { select: { display_name: true } } },
  })
  const code = await issueCode(userId, `EMAIL_CHANGE:${newEmail}`)
  const name = user?.profile?.display_name ?? user?.username ?? "there"
  await resend.emails.send({
    from: FROM,
    to: newEmail,
    subject: "Confirm your new Sub-tree email",
    html: emailLayout({
      preheader: `Your code to confirm ${newEmail}`,
      body:
        greeting(name) +
        p(`Enter this code in Sub-tree to make ${strong(newEmail)} your account email:`, { html: true }) +
        codeBox(code, CODE_TTL_MINUTES) +
        notice("Didn't ask for this? Ignore this email — nothing changes unless someone enters the code."),
    }),
  })
}

// First step of applying for the verification badge — proves the account's
// email is the creator's before any (paid) Smile ID check runs.
export async function sendVerificationCode(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, username: true, profile: { select: { display_name: true } } },
  })
  if (!user?.email) throw new WithdrawalOtpError("NO_EMAIL", "No email on file for this account")

  const code = await issueCode(userId, "VERIFICATION")
  const name = user.profile?.display_name ?? user.username ?? "there"
  await resend.emails.send({
    from: FROM,
    to: user.email,
    subject: "Your Sub-tree verification code",
    html: codeEmail(name, "Use this code to continue your application for the Sub-tree verified badge:", code, "Your code to continue verifying your account"),
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
