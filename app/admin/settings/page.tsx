import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { prisma } from "@/lib/db"
import { getFeeRate } from "@/lib/services/platform-settings"
import { getDonationLaunchStatus, countPendingSubscribers } from "@/lib/services/donation-launch"
import { AdminSettingsClient } from "./AdminSettingsClient"
import { DonationsLaunchCard } from "./DonationsLaunchCard"

export const metadata = { title: "Settings — Admin" }

export default async function AdminSettingsPage() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) redirect("/")

  const [settings, auditLogs, donationRate, withdrawalCreatorRate, withdrawalProcessorRate, donationLaunch, pendingSubscribers] = await Promise.all([
    prisma.platformSetting.findMany({ orderBy: { key: "asc" } }),
    prisma.platformSettingAuditLog.findMany({
      orderBy: { changed_at: "desc" },
      take: 200,
    }),
    getFeeRate("fee_donation_free", 0.05),
    getFeeRate("fee_withdrawal_creator", 0.02),
    getFeeRate("fee_withdrawal_processor", 0.01),
    getDonationLaunchStatus(),
    countPendingSubscribers(),
  ])

  const serializedSettings = settings.map((s) => ({
    ...s,
    updated_at: s.updated_at.toISOString(),
    created_at: s.created_at.toISOString(),
  }))

  const serializedLogs = auditLogs.map((l) => ({
    ...l,
    changed_at: l.changed_at.toISOString(),
  }))

  return (
    <div className="px-4 py-5 md:p-8 max-w-5xl space-y-6">
      <div>
        <p className="text-xs font-mono text-muted-foreground mb-1">Admin</p>
        <h1 className="text-2xl font-semibold tracking-tight">Platform settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fee rates and platform-wide configuration. Changes take effect within 5 minutes.
        </p>
      </div>
      <DonationsLaunchCard
        initialEnabled={donationLaunch.enabled}
        initialLaunchAt={donationLaunch.launchAt?.toISOString() ?? null}
        initialPendingSubscribers={pendingSubscribers}
      />
      <AdminSettingsClient
        settings={serializedSettings}
        auditLogs={serializedLogs}
        donationRate={donationRate}
        withdrawalCreatorRate={withdrawalCreatorRate}
        withdrawalProcessorRate={withdrawalProcessorRate}
      />
    </div>
  )
}
