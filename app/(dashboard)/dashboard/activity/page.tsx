import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { listNotifications } from "@/lib/services/notification"
import { listClientWithdrawals } from "@/lib/services/client-wallet"
import { DonationExportButton } from "@/components/DonationExportButton"
import { ActivityFeed, type ActivityFilter, type ActivityItem } from "@/components/dashboard/ActivityFeed"

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

type Props = { searchParams: Promise<{ filter?: string }> }

export default async function ActivityPage({ searchParams }: Props) {
  const session = await getSession()
  const userId = session!.userId
  const { filter } = await searchParams

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
      .map((n): ActivityItem => ({
        key: `n${n.id}`,
        kind: "update",
        at: n.created_at.toISOString(),
        title: n.title,
        detail: n.body,
        unread: !n.read_at,
        icon: n.type === "SUPPORT_MESSAGE" ? "message" : n.type === "ANNOUNCEMENT" ? "megaphone" : "bell",
        href: n.type === "SUPPORT_MESSAGE" ? "/dashboard/support" : undefined,
      })),
  ].sort((a, b) => b.at.localeCompare(a.at))

  const initialFilter: ActivityFilter =
    filter === "donations" || filter === "withdrawals" || filter === "updates" ? filter : "all"

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-6 md:px-8 md:py-8">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
          <p className="mt-1 text-sm text-muted-foreground">Donations, withdrawals and updates in one place</p>
        </div>
        {donations.length > 0 && <DonationExportButton />}
      </header>
      <ActivityFeed
        items={items}
        initialFilter={initialFilter}
        hasUnread={notifications.some((n) => !n.read_at)}
      />
    </div>
  )
}
