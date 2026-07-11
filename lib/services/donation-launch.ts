import { Resend } from "resend"
import { prisma } from "@/lib/db"
import { getSetting, getSettingAsBool, updateSetting } from "@/lib/services/platform-settings"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = "Sub-tree <onboarding@resend.dev>"

const KEY_ENABLED = "donations_enabled"
const KEY_LAUNCH_AT = "donations_launch_at"

export interface DonationLaunchStatus {
  enabled: boolean
  launchAt: Date | null
}

export async function getDonationLaunchStatus(): Promise<DonationLaunchStatus> {
  const [enabled, launchAtRaw] = await Promise.all([
    getSettingAsBool(KEY_ENABLED, false),
    getSetting(KEY_LAUNCH_AT, ""),
  ])
  const launchAt = launchAtRaw ? new Date(launchAtRaw) : null
  return { enabled, launchAt: launchAt && !isNaN(launchAt.getTime()) ? launchAt : null }
}

export class DonationLaunchError extends Error {
  constructor(
    public readonly code: "INVALID_EMAIL",
    message: string,
  ) {
    super(message)
    this.name = "DonationLaunchError"
  }
}

// Idempotent — re-subscribing with the same email is a silent no-op. userId
// is attached when the caller is logged in, purely for admin visibility;
// anonymous visitors can subscribe with just an email.
export async function subscribeToDonationLaunch(email: string, userId?: number): Promise<void> {
  const trimmed = email.trim().toLowerCase()
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new DonationLaunchError("INVALID_EMAIL", "Enter a valid email address")
  }

  await prisma.donationLaunchSubscriber.upsert({
    where: { email: trimmed },
    update: {},
    create: { email: trimmed, user_id: userId ?? null },
  })
}

export async function countPendingSubscribers(): Promise<number> {
  return prisma.donationLaunchSubscriber.count({ where: { notified_at: null } })
}

// Admin-facing: updates the toggle/target date, and — only on a false→true
// transition — emails every not-yet-notified subscriber that donations are
// live. Manual admin action is the source of truth; the launch date is
// display-only (drives the countdown, doesn't gate anything by itself).
export async function setDonationLaunchStatus(
  enabled: boolean,
  launchAt: Date | null,
  adminUserId: number,
): Promise<{ notifiedCount: number }> {
  const before = await getSettingAsBool(KEY_ENABLED, false)

  await updateSetting(KEY_ENABLED, String(enabled), adminUserId)
  await updateSetting(KEY_LAUNCH_AT, launchAt ? launchAt.toISOString() : "", adminUserId)

  if (!before && enabled) {
    return { notifiedCount: await notifyPendingSubscribers() }
  }
  return { notifiedCount: 0 }
}

async function notifyPendingSubscribers(): Promise<number> {
  const subscribers = await prisma.donationLaunchSubscriber.findMany({
    where: { notified_at: null },
    select: { id: true, email: true },
  })

  let sent = 0
  for (const sub of subscribers) {
    try {
      await resend.emails.send({
        from: FROM,
        to: sub.email,
        subject: "Donations are live on Sub-tree 🎉",
        html: `
          <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px">
            <p>Hi there,</p>
            <p style="color:#374151">Good news — mobile money donations are now live on Sub-tree. Supporters can send you money directly through your Sub-tree page.</p>
            <a href="https://sub-tree.vercel.app" style="display:inline-block;margin-top:12px;padding:10px 20px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px">Go to Sub-tree</a>
            <p style="margin-top:24px">Best regards,<br/><strong>The Sub-tree Team</strong></p>
          </div>
        `,
      })
      sent++
    } catch (err) {
      console.error("Donation-launch notify email failed", { email: sub.email, err })
    }
    await prisma.donationLaunchSubscriber.update({
      where: { id: sub.id },
      data: { notified_at: new Date() },
    })
  }
  return sent
}
