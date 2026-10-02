import { prisma } from "@/lib/db"
import { runEmailTest, sendEmail, type EmailResult } from "@/lib/email/send"
import { sendVerificationEmail, sendWelcomeEmail, sendSigninCode, sendPasswordResetCode } from "@/lib/auth/email"
import { notifyPasswordChanged, notifyAccountDeleted, notifyBankDetailsChanged, notifyNewSignIn, notifyEmailChanged } from "@/lib/services/security-notify"
import { sendWithdrawalOtp, sendBankDetailsOtp, sendEmailChangeCode, sendVerificationCode } from "@/lib/services/withdrawal-otp"
import { requestNumberChange, emailNumberChanged } from "@/lib/services/number-change"
import { notifyWithdrawalRequested, notifyWithdrawalCompleted, notifyWithdrawalFailed } from "@/lib/services/withdrawal-notify"
import { emailVerified, emailInReview, emailRejected, emailTryAgain } from "@/lib/services/verification"
import { receiptEmail, reminderEmail, lapsedEmail, walletRenewFailedEmail, type BillingEmail } from "@/lib/services/billing"
import { emailLayout } from "@/lib/email/template"
import { emailGiftReceived } from "@/lib/services/gift-notify"

// Admin → Emails: sends a real copy of any Sub-tree email to the signed-in
// admin's own inbox, through the same code path creators get, with sample
// data. SMS is switched off and subjects are marked [Test].
// Side effects are limited to the admin's own account: code emails issue a
// fresh (unused, expiring) code for the admin. Nothing touches real
// invoices, withdrawals, badges or other users.

interface Me { id: number; email: string; username: string; name: string }

const SAMPLE_INVOICE = 123
const ctx = () => ({
  device: "Chrome on Windows",
  location: "Kampala, Uganda",
  time: new Date().toLocaleString("en-UG", { timeZone: "Africa/Kampala", dateStyle: "medium", timeStyle: "short" }),
})
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000)
const billing = (me: Me, e: BillingEmail) => sendEmail({ to: me.email, subject: e.subject, html: emailLayout({ preheader: e.preheader, body: e.body }) })
const withdrawal = { amount: 50_000, platformFee: 1_500, processorFee: 500, netAmount: 48_000 }

export const EMAIL_GROUPS: { group: string; emails: { key: string; label: string; send: (me: Me) => Promise<unknown> }[] }[] = [
  {
    group: "Sign-up and sign-in",
    emails: [
      { key: "verify_email", label: "Verify your email (code)", send: (me) => sendVerificationEmail(me.id, me.email) },
      { key: "welcome", label: "Welcome", send: (me) => sendWelcomeEmail(me.email, me.username) },
      { key: "signin_code", label: "Sign-in code", send: (me) => sendSigninCode(me.id, me.email, ctx()) },
      { key: "password_reset", label: "Password reset code", send: (me) => sendPasswordResetCode(me.id, me.email, ctx()) },
      { key: "new_signin", label: "New sign-in alert", send: (me) => notifyNewSignIn(me.id, ctx(), "Password") },
    ],
  },
  {
    group: "Account security",
    emails: [
      { key: "password_changed", label: "Password changed", send: (me) => notifyPasswordChanged(me.id) },
      { key: "email_change_code", label: "Confirm new email (code)", send: (me) => sendEmailChangeCode(me.id, me.email) },
      { key: "email_changed", label: "Email changed alert", send: (me) => notifyEmailChanged(me.id, me.email, "new-address@example.com") },
      { key: "number_change_code", label: "Confirm new number (code)", send: (me) => requestNumberChange(me.id, "+256700000000", "email") },
      { key: "number_changed", label: "Number changed", send: (me) => emailNumberChanged(me.email, "momo_number", "+256700000000") },
      { key: "bank_code", label: "Confirm bank details (code)", send: (me) => sendBankDetailsOtp(me.id) },
      { key: "bank_changed", label: "Bank details changed", send: (me) => notifyBankDetailsChanged(me.id, "Stanbic Bank", "4321") },
      { key: "account_deleted", label: "Account deleted", send: (me) => notifyAccountDeleted(me.email, null) },
    ],
  },
  {
    group: "Gifts",
    emails: [
      {
        key: "gift_received", label: "Gift received (UGX 5,000 or more)",
        send: (me) => emailGiftReceived({ userId: me.id, amount: 20_000, creatorAmount: 19_000, donorName: "Aisha N.", note: "Loved your last video, keep going" }),
      },
    ],
  },
  {
    group: "Wallet and withdrawals",
    emails: [
      { key: "withdraw_code", label: "Withdrawal code", send: (me) => sendWithdrawalOtp(me.id, withdrawal.amount, "email") },
      {
        key: "withdraw_receipt_momo", label: "Withdrawal receipt — mobile money",
        send: (me) => notifyWithdrawalRequested({ userId: me.id, ...withdrawal, reference: "WD-000123", method: "MOBILE_MONEY", destination: "MTN · 0770 000 000", status: "PROCESSING", createdAt: new Date().toISOString() }),
      },
      {
        key: "withdraw_receipt_bank", label: "Withdrawal receipt — bank",
        send: (me) => notifyWithdrawalRequested({ userId: me.id, ...withdrawal, reference: "WD-000124", method: "BANK", destination: "Stanbic Bank · ****4321", status: "PENDING", createdAt: new Date().toISOString() }),
      },
      { key: "withdraw_complete", label: "Withdrawal complete", send: (me) => notifyWithdrawalCompleted({ userId: me.id, ...withdrawal }) },
      { key: "withdraw_failed", label: "Withdrawal failed", send: (me) => notifyWithdrawalFailed(me.id, withdrawal.amount) },
    ],
  },
  {
    group: "Verification badge",
    emails: [
      { key: "verification_code", label: "Verification code", send: (me) => sendVerificationCode(me.id) },
      { key: "verified", label: "You're verified", send: (me) => emailVerified(me.id) },
      { key: "in_review", label: "Being reviewed", send: (me) => emailInReview(me.id) },
      { key: "rejected", label: "Couldn't verify", send: (me) => emailRejected(me.id) },
      { key: "try_again", label: "Please try again", send: (me) => emailTryAgain(me.id) },
    ],
  },
  {
    group: "Sub-pay billing",
    emails: [
      {
        key: "receipt_first", label: "Receipt — first payment",
        send: (me) => billing(me, receiptEmail({ name: me.name, invoiceId: SAMPLE_INVOICE, amount: 10_000, plan: "MONTHLY", method: "MOBILE_MONEY", paidOn: new Date(), end: inDays(30), firstTime: true })),
      },
      {
        key: "receipt_renewal", label: "Receipt — renewal",
        send: (me) => billing(me, receiptEmail({ name: me.name, invoiceId: SAMPLE_INVOICE, amount: 100_000, plan: "ANNUAL", method: "WALLET", paidOn: new Date(), end: inDays(365), firstTime: false })),
      },
      {
        key: "reminder_7", label: "Renewal reminder — 7 days",
        send: (me) => billing(me, reminderEmail({ name: me.name, invoiceId: SAMPLE_INVOICE, amount: 10_000, plan: "MONTHLY", end: inDays(7), tomorrow: false, how: `Pay before the due date to keep your badge.` })),
      },
      {
        key: "reminder_1", label: "Renewal reminder — tomorrow",
        send: (me) => billing(me, reminderEmail({ name: me.name, invoiceId: SAMPLE_INVOICE, amount: 10_000, plan: "MONTHLY", end: inDays(1), tomorrow: true, how: `We'll renew it from your Sub-tree wallet — make sure it has UGX 10,000.` })),
      },
      { key: "wallet_renew_failed", label: "Wallet renewal failed", send: (me) => billing(me, walletRenewFailedEmail({ name: me.name, invoiceId: SAMPLE_INVOICE, amount: 10_000 })) },
      { key: "lapsed", label: "Badge hidden (lapsed)", send: (me) => billing(me, lapsedEmail({ name: me.name, invoiceId: SAMPLE_INVOICE, end: inDays(-4) })) },
    ],
  },
]

const ALL = EMAIL_GROUPS.flatMap((g) => g.emails)
export const EMAIL_KEYS = ALL.map((e) => e.key)

export interface TestOutcome { key: string; label: string; results: EmailResult[]; error?: string }

// Resend allows about 2 sends a second, so "send all" paces itself.
export async function sendTestEmails(adminId: number, keys: string[]): Promise<{ to: string; outcomes: TestOutcome[] }> {
  const u = await prisma.user.findUniqueOrThrow({
    where: { id: adminId },
    select: { email: true, username: true, profile: { select: { display_name: true } } },
  })
  const me: Me = { id: adminId, email: u.email, username: u.username ?? "you", name: u.profile?.display_name ?? u.username ?? "there" }

  const outcomes: TestOutcome[] = []
  for (const [i, e] of ALL.filter((x) => keys.includes(x.key)).entries()) {
    if (i > 0) await new Promise((r) => setTimeout(r, 600))
    let error: string | undefined
    const results = await runEmailTest(async () => {
      try { await e.send(me) } catch (err) { error = err instanceof Error ? err.message : String(err) }
    })
    outcomes.push({ key: e.key, label: e.label, results, ...(error ? { error } : {}) })
  }
  return { to: me.email, outcomes }
}
