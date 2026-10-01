import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { getClientBalance, listClientWithdrawals } from "@/lib/services/client-wallet"
import { getFeeRate } from "@/lib/services/platform-settings"
import { DashboardHome } from "@/components/dashboard/DashboardHome"

export default async function DashboardHomePage() {
  const session = await getSession()
  const userId = session!.userId

  // One parallel batch — none of these depend on each other.
  const [user, donationStats, topLink, providerBreakdown, referrerBreakdown, balance, withdrawals, inTransit, creatorFeeRate, processorFeeRate] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          username: true,
          profile: { select: { display_name: true, view_count: true } },
          _count: { select: { links: true } },
        },
      }),
      prisma.donation.aggregate({
        where: { user_id: userId, status: "COMPLETED" },
        _count: { id: true },
        _sum: { amount: true },
      }),
      prisma.link.findFirst({
        where: { user_id: userId, is_enabled: true, clicks: { gt: 0 } },
        orderBy: { clicks: "desc" },
        select: { label: true, clicks: true, url: true },
      }),
      prisma.donation.groupBy({
        by: ["provider"],
        where: { user_id: userId, status: "COMPLETED" },
        _count: { id: true },
      }),
      prisma.donation.groupBy({
        by: ["referrer_source"],
        where: { user_id: userId, status: "COMPLETED", referrer_source: { not: null } },
        _count: { id: true },
        _sum: { amount: true },
      }),
      getClientBalance(userId),
      listClientWithdrawals(userId, 5),
      // Requested but not yet paid out — shown as "on its way" on the card.
      prisma.clientWithdrawal.aggregate({
        where: { user_id: userId, status: { in: ["PENDING", "PROCESSING"] } },
        _sum: { net_amount: true },
      }),
      getFeeRate("fee_withdrawal_creator", 0.02),
      getFeeRate("fee_withdrawal_processor", 0.01),
    ])

  const providerCount = (p: string) => providerBreakdown.find((r) => r.provider === p)?._count.id ?? 0

  return (
    <DashboardHome
      data={{
        displayName: user?.profile?.display_name ?? user?.username ?? "Creator",
        username: user?.username ?? "",
        wallet: {
          available: balance.available,
          totalReceived: donationStats._sum.amount ?? 0,
          inTransit: Number(inTransit._sum.net_amount ?? 0),
          creatorFeeRate,
          processorFeeRate,
        },
        withdrawals: withdrawals.map((w) => ({
          id: w.id,
          amount: Number(w.amount),
          net_amount: Number(w.net_amount),
          status: w.status,
          created_at: w.created_at,
        })),
        stats: {
          links: user?._count.links ?? 0,
          donations: donationStats._count.id,
          views: user?.profile?.view_count ?? 0,
        },
        providers: { mtn: providerCount("MTN_MOMO"), airtel: providerCount("AIRTEL_MONEY"), card: providerCount("CARD") },
        topReferrers: referrerBreakdown
          .filter((r) => r.referrer_source)
          .sort((a, b) => b._count.id - a._count.id)
          .slice(0, 5)
          .map((r) => ({ source: String(r.referrer_source), count: r._count.id, amount: r._sum.amount ?? 0 })),
        topLink,
      }}
    />
  )
}
