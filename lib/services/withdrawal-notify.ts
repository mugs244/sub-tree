import { Resend } from "resend"
import { prisma } from "@/lib/db"
import { sendSms } from "@/lib/sms"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Sub-tree <hello@sub-tree.com>"

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

// The receipt fields are optional so the admin platform-revenue sweep
// (lib/services/wallet.ts), which has no reference or destination, can reuse
// this email.
export interface WithdrawalReceiptNotification extends WithdrawalNotification {
  reference?: string
  method?: "MOBILE_MONEY" | "BANK"
  destination?: string
  status?: string
  createdAt?: string
}

function whatHappensNext(r: WithdrawalReceiptNotification): string {
  if (r.status === "FAILED") return "This withdrawal couldn't be sent. You'll get a separate message with the reason, and the amount is back in your balance."
  if (r.method === "BANK") return "Bank transfers are sent by the Sub-tree team, usually within 1–3 business days. We'll email you when it's done."
  if (r.status === "PROCESSING") return "It's on its way to your mobile money number — usually within a few minutes. We'll let you know when it arrives."
  return "The Sub-tree team will send it to your mobile money number shortly. We'll let you know when it's done."
}

// The withdrawal receipt, emailed as soon as a withdrawal is approved with
// its code, plus a short SMS. Never throws into the request.
export async function notifyWithdrawalRequested(r: WithdrawalReceiptNotification): Promise<void> {
  const { name, email, phone } = await getNameEmailPhone(r.userId)
  const totalFee = r.platformFee + r.processorFee

  if (phone) {
    await sendSms(
      phone,
      `Sub-tree: Withdrawal ${r.reference ? `${r.reference} ` : ""}of ${fmt(r.amount)} approved. Fees ${fmt(totalFee)}, you'll receive ${fmt(r.netAmount)}. Not you? Contact support now.`,
    )
  }

  if (!email) return
  const date = new Date(r.createdAt ?? Date.now()).toLocaleString("en-UG", { timeZone: "Africa/Kampala", dateStyle: "medium", timeStyle: "short" })
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:8px 0;color:${strong ? "#111827" : "#6b7280"};${strong ? "font-weight:700;" : ""}">${label}</td><td style="padding:8px 0;text-align:right;font-family:monospace;${strong ? "font-weight:700;font-size:16px;" : ""}">${value}</td></tr>`

  try {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: `Withdrawal receipt${r.reference ? ` ${r.reference}` : ""} — ${fmt(r.netAmount)}`,
      html: `
        <div style="font-family:sans-serif;max-width:460px;margin:0 auto;padding:24px;color:#111827">
          <div style="background:#111827;color:#ffffff;border-radius:16px;padding:20px 22px">
            <div style="font-size:13px;opacity:.7">Sub-tree withdrawal receipt</div>
            <div style="font-size:30px;font-weight:800;margin-top:6px">${fmt(r.netAmount)}</div>
            ${r.destination ? `<div style="font-size:13px;opacity:.7;margin-top:2px">to ${r.destination}</div>` : ""}
          </div>
          <p style="margin:20px 0 4px">Hi ${name},</p>
          <p style="color:#4b5563;margin:0 0 12px">Here's the receipt for your withdrawal.</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            ${r.reference ? row("Reference", r.reference) : ""}
            ${row("Date", date)}
            ${row("Method", r.method === "BANK" ? "Bank transfer" : "Mobile money")}
            ${row("Amount withdrawn", fmt(r.amount))}
            ${row("Sub-tree fee", fmt(r.platformFee))}
            ${row("Transfer cost", fmt(r.processorFee))}
            <tr><td colspan="2" style="border-top:1px solid #e5e7eb"></td></tr>
            ${row("You receive", fmt(r.netAmount), true)}
          </table>
          <p style="background:#fff1e6;border-radius:12px;padding:12px 14px;color:#9a3412;font-size:13px;margin-top:18px">${whatHappensNext(r)}</p>
          <p style="color:#dc2626;font-size:12px;margin-top:16px">Didn't make this withdrawal? Change your password and reply to this email immediately.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error("Withdrawal receipt email failed", { userId: r.userId, err })
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
