import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { getClientBalance } from "@/lib/services/client-wallet"
import { DashboardHome, type RecentTransaction } from "@/components/dashboard/DashboardHome"

export default async function DashboardHomePage() {
  const session = await getSession()
  const userId = session!.userId

  // One parallel batch — none of these depend on each other.
  const [user, received, balance, inTransit, donations, withdrawals] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, profile: { select: { display_name: true } } },
    }),
    prisma.donation.aggregate({ where: { user_id: userId, status: "COMPLETED" }, _sum: { amount: true } }),
    getClientBalance(userId),
    // Requested but not yet paid out — shown as "on its way" on the card.
    prisma.clientWithdrawal.aggregate({
      where: { user_id: userId, status: { in: ["PENDING", "PROCESSING"] } },
      _sum: { net_amount: true },
    }),
    prisma.donation.findMany({
      where: { user_id: userId, status: { in: ["COMPLETED", "PENDING", "PROCESSING"] } },
      orderBy: { created_at: "desc" },
      take: 5,
      select: { id: true, donor_name: true, amount: true, status: true, created_at: true },
    }),
    prisma.clientWithdrawal.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 5,
      select: { id: true, amount: true, status: true, created_at: true, payout_method: true },
    }),
  ])

  const recent: RecentTransaction[] = [
    ...donations.map((d): RecentTransaction => ({
      key: `d${d.id}`,
      kind: "donation",
      title: d.donor_name || "Anonymous supporter",
      at: d.created_at,
      amount: d.amount,
      status: d.status === "COMPLETED" ? undefined : d.status,
    })),
    ...withdrawals.map((w): RecentTransaction => ({
      key: `w${w.id}`,
      kind: "withdrawal",
      title: w.payout_method === "BANK" ? "Withdrawal to bank" : "Withdrawal to mobile money",
      at: w.created_at,
      amount: -Number(w.amount),
      status: w.status === "COMPLETED" ? undefined : w.status,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 5)

  return (
    <DashboardHome
      data={{
        displayName: user?.profile?.display_name ?? user?.username ?? "Creator",
        username: user?.username ?? "",
        wallet: {
          available: balance.available,
          totalReceived: received._sum.amount ?? 0,
          inTransit: Number(inTransit._sum.net_amount ?? 0),
        },
        recent,
      }}
    />
  )
}
