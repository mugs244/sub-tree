import { getSetting, getSettingAsBool, updateSetting } from "@/lib/services/platform-settings"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"

// The donations switch (Admin → Settings). On = every creator's Support
// button works; off = it's greyed out ("opens soon"). It's an on/off switch
// and nothing more — the old "notify me when donations open" email list has
// been removed (its DonationLaunchSubscriber table is kept, unused).

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

// Admin test mode: while donations are switched off, a signed-in admin can
// still make test donations. Nobody else sees a change.
export async function getDonationLaunchStatusForViewer(): Promise<DonationLaunchStatus & { adminTest: boolean }> {
  const status = await getDonationLaunchStatus()
  if (status.enabled) return { ...status, adminTest: false }
  const session = await getSession()
  const admin = Boolean(session && isAdmin(session.userId))
  return { ...status, enabled: admin, adminTest: admin }
}

export async function setDonationLaunchStatus(enabled: boolean, launchAt: Date | null, adminUserId: number): Promise<void> {
  await updateSetting(KEY_ENABLED, String(enabled), adminUserId)
  await updateSetting(KEY_LAUNCH_AT, launchAt ? launchAt.toISOString() : "", adminUserId)
}
