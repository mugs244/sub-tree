import Link from "next/link"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { listNotifications } from "@/lib/services/notification"
import { listClientWithdrawals } from "@/lib/services/client-wallet"
import { DonationExportButton } from "@/components/DonationExportButton"
import { ActivityFeed, type ActivityFilter, type ActivityItem } from "@/components/dashboard/ActivityFeed"
import { ActivityInsights, type InsightsData } from "@/components/dashboard/ActivityInsights"

export const metadata = { title: "Activity" }

const PROVIDER_LABEL: Record<string, string> = {
  MTN_MOMO: "MTN MoMo",
  AIRTEL_MONEY: "Airtel Money",
  CARD: "Card",
}

// Donation and withdrawal notifications are left out of the feed: the
// donations and withdrawals themselves are listed (with their current
// status), so including the notifications too would show each one twice.
const DUPLICATE_NOTIFICATION_TYPES = new Set(["DONATION_RECEIVED", "WITHDRAWAL_REQUESTED", "WITHDRAWAL_COMPLETED", "WITHDRAWAL_FAILED"])

type Props = { searchParams: Promise<{ filter?: string; tab?: string }> }

async function loadInsights(userId: number): Promise<InsightsData> {
  const [user, taps, topLinks, donationCount, providers, referrers] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { username: true, profile: { select: { view_count: true } } } }),
    prisma.link.aggregate({ where: { user_id: userId }, _sum: { clicks: true } }),
    prisma.link.findMany({
      where: { user_id: userId, clicks: { gt: 0 } },
      orderBy: { clicks: "desc" },
      take: 5,
      select: { id: true, label: true, url: true, clicks: true },
    }),
    prisma.donation.count({ where: { user_id: userId, status: "COMPLETED" } }),
    prisma.donation.groupBy({ by: ["provider"], where: { user_id: userId, status: "COMPLETED" }, _count: { id: true } }),
    prisma.donation.groupBy({
      by: ["referrer_source"],
      where: { user_id: userId, status: "COMPLETED", referrer_source: { not: null } },
      _count: { id: true },
      _sum: { amount: true },
    }),
  ])
  const providerCount = (p: string) => providers.find((r) => r.provider === p)?._count.id ?? 0
  return {
    username: user?.username ?? "",
    views: user?.profile?.view_count ?? 0,
    taps: taps._sum.clicks ?? 0,
    donations: donationCount,
    topLinks,
    providers: { mtn: providerCount("MTN_MOMO"), airtel: providerCount("AIRTEL_MONEY"), card: providerCount("CARD") },
    topReferrers: referrers
      .filter((r) => r.referrer_source)
      .sort((a, b) => b._count.id - a._count.id)
      .slice(0, 5)
      .map((r) => ({ source: String(r.referrer_source), count: r._count.id, amount: r._sum.amount ?? 0 })),
  }
}

export default async function ActivityPage({ searchParams }: Props) {
  const session = await getSession()
  const userId = session!.userId
  const { filter, tab } = await searchParams

  if (tab === "insights") {
    return (
      <ActivityShell tab="insights">
        <ActivityInsights data={await loadInsights(userId)} />
      </ActivityShell>
    )
  }

  const [donations, withdrawals, notifications] = await Promise.all([
    prisma.donation.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 50,
      select: { id: true, donor_name: true, donor_phone: true, amount: true, status: true, provider: true, created_at: true },
    }),
    listClientWithdrawals(userId, 30),
    listNotifications(userId, 50),
  ])

  const items: ActivityItem[] = [
    ...donations.map((d): ActivityItem => ({
      key: `d${d.id}`,
      kind: "donation",
      at: d.created_at.toISOString(),
      title: d.donor_name || "Anonymous supporter",
      detail: `Donation via ${PROVIDER_LABEL[d.provider] ?? d.provider}${d.donor_phone ? ` · ${d.donor_phone}` : ""}`,
      amount: d.amount,
      status: d.status === "COMPLETED" ? undefined : d.status,
      icon: "heart",
    })),
    ...withdrawals.map((w): ActivityItem => ({
      key: `w${w.id}`,
      kind: "withdrawal",
      at: w.created_at.toISOString(),
      title: "Withdrawal to mobile money",
      detail: `UGX ${Number(w.net_amount).toLocaleString()} after fees`,
      amount: -Number(w.amount),
      status: w.status === "COMPLETED" ? undefined : w.status,
      icon: "out",
    })),
    ...notifications
      .filter((n) => !DUPLICATE_NOTIFICATION_TYPES.has(n.type))
      .map((n): ActivityItem => {
        // Billing notices carry a link and button label in metadata.
        const meta = (n.metadata ?? {}) as { href?: string; action?: string }
        return {
        key: `n${n.id}`,
        kind: "update",
        at: n.created_at.toISOString(),
        title: n.title,
        detail: n.body,
        unread: !n.read_at,
        icon: n.type === "SUPPORT_MESSAGE" ? "message" : n.type === "ANNOUNCEMENT" ? "megaphone" : "bell",
        href: meta.href ?? (n.type === "SUPPORT_MESSAGE" ? "/dashboard/support" : undefined),
        action: meta.action,
      }
      }),
  ].sort((a, b) => b.at.localeCompare(a.at))

  const initialFilter: ActivityFilter =
    filter === "donations" || filter === "withdrawals" || filter === "updates" ? filter : "all"

  return (
    <ActivityShell tab="history" action={donations.length > 0 ? <DonationExportButton /> : null}>
      <ActivityFeed
        items={items}
        initialFilter={initialFilter}
        hasUnread={notifications.some((n) => !n.read_at)}
      />
    </ActivityShell>
  )
}

// Page frame with the History / Insights switch.
function ActivityShell({ tab, action, children }: { tab: "history" | "insights"; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pb-6 pt-2 md:px-8 md:py-8">
      <header className="flex items-center justify-between gap-3">
        <h1 className="hidden text-3xl font-bold tracking-tight md:block">Activity</h1>
        <nav className="flex rounded-full bg-surface p-1" aria-label="Activity views">
          {(["history", "insights"] as const).map((t) => (
            <Link
              key={t}
              href={t === "history" ? "/dashboard/activity" : "/dashboard/activity?tab=insights"}
              aria-current={tab === t ? "page" : undefined}
              className={[
                "rounded-full px-5 py-2 text-sm font-semibold transition-colors duration-150",
                tab === t ? "bg-[#111827] text-white dark:bg-white dark:text-[#111827]" : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {t === "history" ? "History" : "Insights"}
            </Link>
          ))}
        </nav>
        {action ?? <span />}
      </header>
      {children}
    </div>
  )
}
