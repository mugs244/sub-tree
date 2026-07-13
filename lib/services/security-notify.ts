import { Resend } from "resend"
import { prisma } from "@/lib/db"
import { sendSms } from "@/lib/sms"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Sub-tree <onboarding@resend.dev>"

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
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px">
            <h2 style="margin:0 0 8px">Password changed</h2>
            <p style="color:#374151">Your Sub-tree password was just changed.</p>
            <p style="color:#dc2626;font-size:13px;margin-top:16px">If you didn't make this change, contact support immediately.</p>
          </div>
        `,
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
        html: `
          <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px">
            <h2 style="margin:0 0 8px">Account deleted</h2>
            <p style="color:#374151">Your Sub-tree account and profile have been deleted. Your username is now free for anyone to claim.</p>
            <p style="color:#dc2626;font-size:13px;margin-top:16px">If you didn't request this, contact support immediately.</p>
          </div>
        `,
      })
    } catch (err) {
      console.error("Account-deleted email failed", { email, err })
    }
  }
}
