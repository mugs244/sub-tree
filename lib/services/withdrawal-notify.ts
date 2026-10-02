import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email/send"
import { sendSms } from "@/lib/sms"
import { emailLayout, heading, greeting, p, amountCard, details, notice, securityNote, button } from "@/lib/email/template"


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
  const rows: [string, string][] = [
    ...(r.reference ? [["Reference", r.reference] as [string, string]] : []),
    ["Date", date],
    ...(r.method ? [["Method", r.method === "BANK" ? "Bank transfer" : "Mobile money"] as [string, string]] : []),
    ["Amount withdrawn", fmt(r.amount)],
    ["Sub-tree fee", `− ${fmt(r.platformFee)}`],
    ["Transfer cost", `− ${fmt(r.processorFee)}`],
    ["You receive", fmt(r.netAmount)],
  ]

  try {
    await sendEmail({
      to: email,
      subject: `Withdrawal receipt${r.reference ? ` ${r.reference}` : ""} — ${fmt(r.netAmount)}`,
      html: emailLayout({
        preheader: `You'll receive ${fmt(r.netAmount)} after ${fmt(totalFee)} in fees.`,
        body:
          heading("Withdrawal receipt") +
          greeting(name) +
          p("Here's the receipt for your withdrawal.") +
          amountCard("You receive", fmt(r.netAmount), r.destination ? `to ${r.destination}` : undefined) +
          details(rows, { emphasiseLast: true }) +
          notice(whatHappensNext(r), r.status === "FAILED" ? "danger" : "info") +
          securityNote("Didn't make this withdrawal? Change your password and reply to this email right away."),
      }),
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
    await sendEmail({
      to: email,
      subject: `Withdrawal complete — ${fmt(n.netAmount)} sent`,
      html: emailLayout({
        preheader: `${fmt(n.netAmount)} has been sent to you.`,
        body:
          heading("Withdrawal complete") +
          greeting(name) +
          p("Good news — your withdrawal has been sent.") +
          amountCard("Sent to you", fmt(n.netAmount)) +
          details([
            ["Amount withdrawn", fmt(n.amount)],
            ["Sub-tree fee", `− ${fmt(n.platformFee)}`],
            ["Transfer cost", `− ${fmt(n.processorFee)}`],
            ["You received", fmt(n.netAmount)],
          ], { emphasiseLast: true }) +
          notice("Mobile money usually arrives within minutes. A bank transfer can take up to a business day to show in your account.", "success") +
          p("Questions about this transfer? Just reply to this email.", { muted: true, size: 13 }),
      }),
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
    await sendEmail({
      to: email,
      subject: `Your ${fmt(amount)} withdrawal couldn't be sent`,
      html: emailLayout({
        preheader: "The money is back in your Sub-tree balance.",
        body:
          heading("Withdrawal not sent") +
          greeting(name) +
          p("We couldn't send your withdrawal, so nothing left your account.") +
          amountCard("Back in your balance", fmt(amount)) +
          p("This usually happens when the mobile money number or bank account is wrong or inactive, or the payment network had a temporary problem.") +
          notice("Check your details in Settings → Payouts, then withdraw again from your dashboard. You'll also see the reason in your Activity feed.") +
          button("Check payout details", "https://sub-tree.com/dashboard/settings#payouts") +
          p("Still stuck? Reply to this email and we'll sort it out with you.", { muted: true, size: 13 }),
      }),
    })
  } catch (err) {
    console.error("Withdrawal failed email send failed", { userId, err })
  }
}
