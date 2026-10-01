import { Resend } from "resend"
import { prisma } from "@/lib/db"
import { sendSms } from "@/lib/sms"
import { emailLayout, heading, p, strong, notice } from "@/lib/email/template"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Sub-tree <hello@sub-tree.com>"

// Fire-and-forget from the caller's perspective — never throw into the
// account action itself. Same rule as donation/withdrawal notifications.
export async function notifyPasswordChanged(userId: number): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true, email: true } })
  if (!user) return

  if (user.phone) {
    await sendSms(user.phone, "Sub-tree: Your password was just changed. If this wasn't you, contact support immediately.")
  }

  if (user.email) {
    try {
      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: "Your Sub-tree password was changed",
        html: emailLayout({
          preheader: "Your Sub-tree password was just changed.",
          body: heading("Password changed") + p("Your Sub-tree password was just changed. If that was you, there's nothing else to do.") + notice("If you didn't make this change, reply to this email right away so we can secure your account.", "danger"),
        }),
      })
    } catch (err) {
      console.error("Password-changed email failed", { userId, err })
    }
  }
}

export async function notifyAccountDeleted(email: string | null, phone: string | null): Promise<void> {
  if (phone) {
    await sendSms(phone, "Sub-tree: Your account has been deleted. If this wasn't you, contact support immediately.")
  }

  if (email) {
    try {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: "Your Sub-tree account was deleted",
        html: emailLayout({
          preheader: "Your Sub-tree account and profile have been deleted.",
          body: heading("Account deleted") + p("Your Sub-tree account and profile have been deleted, and your username is now free for anyone to claim.") + p("Thank you for being part of Sub-tree. You're always welcome back.", { muted: true, size: 14 }) + notice("If you didn't request this, reply to this email immediately.", "danger"),
        }),
      })
    } catch (err) {
      console.error("Account-deleted email failed", { email, err })
    }
  }
}

// Bank details decide where withdrawals go, so any change is announced on
// both channels, like a password change.
export async function notifyBankDetailsChanged(userId: number, bankName: string, last4: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true, email: true } })
  if (!user) return

  if (user.phone) {
    await sendSms(user.phone, `Sub-tree: Your withdrawal bank account was changed to ${bankName} ending ${last4}. If this wasn't you, contact support immediately.`)
  }

  if (user.email) {
    try {
      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: "Your Sub-tree bank details were changed",
        html: emailLayout({
          preheader: `Bank withdrawals now go to ${bankName} ending ${last4}`,
          body: heading("Bank details changed") + p(`Withdrawals to a bank will now go to ${strong(bankName)}, account ending ${strong(last4)}.`, { html: true }) + notice("If you didn't make this change, reply to this email immediately.", "danger"),
        }),
      })
    } catch (err) {
      console.error("Bank-details email failed", { userId, err })
    }
  }
}
