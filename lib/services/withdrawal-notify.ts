import { Resend } from "resend"
import { prisma } from "@/lib/db"
import { sendSms } from "@/lib/sms"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Sub-tree <onboarding@resend.dev>"

interface WithdrawalNotification {
  userId: number
  amount: number
  platformFee: number
  processorFee: number
  netAmount: number
}

function fmt(v: number): string {
  return `UGX ${Math.round(v).toLocaleString()}`
}

// Notification failures must never crash the withdrawal request itself —
// same rule as donation SMS. Fire-and-forget from the caller's perspective.
export async function notifyWithdrawalRequested(n: WithdrawalNotification): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: n.userId },
    select: { phone: true, email: true },
  })
  if (!user) return

  const totalFee = n.platformFee + n.processorFee

  if (user.phone) {
    await sendSms(
      user.phone,
      `Sub-tree: Withdrawal request received for ${fmt(n.amount)}. Fee: ${fmt(totalFee)}. You'll receive ${fmt(n.netAmount)}. Didn't request this? Secure your account and contact support immediately.`,
    )
  }

  if (user.email) {
    try {
      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: `Withdrawal request received — ${fmt(n.amount)}`,
        html: `
          <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px">
            <h2 style="margin:0 0 8px">Withdrawal request received</h2>
            <p style="color:#6b7280;margin:0 0 20px">We've received your request to withdraw funds. Here's the breakdown:</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
              <tr><td style="padding:6px 0;color:#6b7280">Amount requested</td><td style="padding:6px 0;text-align:right;font-family:monospace">${fmt(n.amount)}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280">Fees</td><td style="padding:6px 0;text-align:right;font-family:monospace">${fmt(totalFee)}</td></tr>
              <tr style="border-top:1px solid #e5e7eb"><td style="padding:6px 0;font-weight:600">You&apos;ll receive</td><td style="padding:6px 0;text-align:right;font-family:monospace;font-weight:600">${fmt(n.netAmount)}</td></tr>
            </table>
            <p style="color:#6b7280;font-size:13px">This request is pending and is processed manually until automatic payouts are enabled.</p>
            <p style="color:#dc2626;font-size:13px;margin-top:16px">Keep your account safe: never share your password or one-time codes with anyone, including anyone claiming to be Sub-tree support. If you didn&apos;t request this withdrawal, contact us immediately and change your password.</p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Withdrawal email send failed", { userId: n.userId, err })
    }
  }
}

async function getNameEmailPhone(userId: number): Promise<{ name: string; email: string | null; phone: string | null }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, email: true, phone: true, profile: { select: { display_name: true } } },
  })
  return {
    name: user?.profile?.display_name ?? user?.username ?? "there",
    email: user?.email ?? null,
    phone: user?.phone ?? null,
  }
}

// Fired when an admin marks a withdrawal COMPLETED — the money has actually
// been sent (manually, until the real payout API is wired in).
export async function notifyWithdrawalCompleted(n: WithdrawalNotification): Promise<void> {
  const { name, email, phone } = await getNameEmailPhone(n.userId)

  if (phone) {
    await sendSms(phone, `Sub-tree: Your withdrawal of ${fmt(n.amount)} is complete. You'll receive ${fmt(n.netAmount)} after fees.`)
  }

  if (!email) return

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Confirmed: Your ${fmt(n.amount)} Withdrawal is Complete ✅`,
      html: `
        <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px">
          <p>Hi ${name},</p>
          <p style="color:#374151">We are writing to confirm that your withdrawal request for <strong>${fmt(n.amount)}</strong> has been successfully completed. The funds are currently being processed and will be routed to your designated account.</p>
          <p style="font-weight:600;margin-bottom:4px">Price breakdown:</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:16px">
            <tr><td style="padding:6px 0;color:#6b7280">Gross Withdrawal Amount</td><td style="padding:6px 0;text-align:right;font-family:monospace">${fmt(n.amount)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Processing Fee</td><td style="padding:6px 0;text-align:right;font-family:monospace">-${fmt(n.platformFee)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b7280">Network/Transfer Fee</td><td style="padding:6px 0;text-align:right;font-family:monospace">-${fmt(n.processorFee)}</td></tr>
            <tr style="border-top:1px solid #e5e7eb"><td style="padding:6px 0;font-weight:600">Total Net Payout</td><td style="padding:6px 0;text-align:right;font-family:monospace;font-weight:600">${fmt(n.netAmount)}</td></tr>
          </table>
          <blockquote style="color:#6b7280;font-size:13px;border-left:3px solid #e5e7eb;padding-left:12px;margin:0 0 16px">Please allow 1-3 business days for the funds to fully reflect in your account, depending on your financial institution.</blockquote>
          <p style="color:#374151">If you have any questions regarding this transfer, please reach out to our support team.</p>
          <p style="margin-top:24px">Best regards,<br/><strong>The Subtree Team</strong></p>
        </div>
      `,
    })
  } catch (err) {
    console.error("Withdrawal completed email send failed", { userId: n.userId, err })
  }
}

// Fired when an admin marks a withdrawal FAILED.
export async function notifyWithdrawalFailed(userId: number, amount: number): Promise<void> {
  const { name, email, phone } = await getNameEmailPhone(userId)

  if (phone) {
    await sendSms(phone, `Sub-tree: Your withdrawal of ${fmt(amount)} failed. Check your payment details and try again, or contact support.`)
  }

  if (!email) return

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Action Required: Your Recent Transaction Failed ⚠️`,
      html: `
        <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px">
          <p>Hi ${name},</p>
          <p style="color:#374151">We are reaching out to let you know that your recent transaction attempt of <strong>${fmt(amount)}</strong> was unsuccessful.</p>
          <p style="color:#374151">We know this can be frustrating. Transactions typically fail for one of the following reasons:</p>
          <ul style="color:#374151;font-size:14px;padding-left:20px">
            <li>Insufficient funds or limits reached on the payment method.</li>
            <li>A temporary network or connection timeout.</li>
            <li>Incorrect billing details provided.</li>
          </ul>
          <p style="font-weight:600;margin-bottom:4px">Next Steps:</p>
          <p style="color:#374151">Please check your payment details and ensure your account has sufficient funds, then try submitting the transaction again.</p>
          <p style="color:#374151">If the issue persists, please reply directly to this email. We are here to help you get this sorted out right away.</p>
          <p style="margin-top:24px">Best regards,<br/><strong>The Subtree Team</strong></p>
        </div>
      `,
    })
  } catch (err) {
    console.error("Withdrawal failed email send failed", { userId, err })
  }
}
