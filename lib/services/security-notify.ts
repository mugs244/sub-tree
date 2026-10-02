import { Resend } from "resend"
import { prisma } from "@/lib/db"
import { sendSms } from "@/lib/sms"
import { emailLayout, heading, p, strong, notice, details, button } from "@/lib/email/template"
import type { LoginContext } from "@/lib/auth/login-context"

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

// Sent after every successful password or Google sign-in (a sign-in code
// email already shows the attempt itself). Email only, so it's free and
// doesn't nag by SMS.
export async function notifyNewSignIn(userId: number, ctx: LoginContext, method: "Password" | "Google"): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (!user?.email) return
  try {
    await resend.emails.send({
      from: FROM,
      to: user.email,
      subject: "New sign-in to your Sub-tree account",
      html: emailLayout({
        preheader: `${ctx.device}${ctx.location ? ` near ${ctx.location}` : ""}`,
        body:
          heading("New sign-in") +
          p("Your Sub-tree account was just signed in to.") +
          details([
            ["When", ctx.time],
            ["Device", ctx.device],
            ...(ctx.location ? [["Near", ctx.location] as [string, string]] : []),
            ["Signed in with", method],
          ]) +
          notice("If this was you, there's nothing to do. If it wasn't, reset your password now — that signs the other person out.", "info") +
          button("Reset password", "https://sub-tree.com/forgot-password"),
      }),
    })
  } catch (err) {
    console.error("New sign-in email failed", { userId, err })
  }
}

// The old address hears about an email change, since it's the one the real
// owner still reads if the change wasn't them. SMS too, when there's a phone.
export async function notifyEmailChanged(userId: number, oldEmail: string, newEmail: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true } })
  if (user?.phone) {
    await sendSms(user.phone, `Sub-tree: Your account email was changed to ${newEmail}. If this wasn't you, contact support immediately.`)
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: oldEmail,
      subject: "Your Sub-tree email was changed",
      html: emailLayout({
        preheader: `Your account email is now ${newEmail}`,
        body:
          heading("Email changed") +
          p(`Your Sub-tree account email was changed from ${strong(oldEmail)} to ${strong(newEmail)}. Sign-in codes and receipts now go there.`, { html: true }) +
          notice("If you didn't make this change, reply to this email immediately so we can secure your account.", "danger"),
      }),
    })
  } catch (err) {
    console.error("Email-changed alert failed", { userId, err })
  }
}
