import { prisma } from "@/lib/db"
import { getClientBalance } from "@/lib/services/client-wallet"
import { isBadgeLive, getRefundMeter } from "@/lib/services/billing"

// Data for the admin portal: what needs someone's attention right now,
// headline revenue, and a full picture of one creator.

export interface AttentionQueue {
  withdrawalsToSend: number
  bankWithdrawals: number
  verificationReviews: number
  overdueInvoices: number
  unreadSupport: number
}

export async function getAttentionQueue(): Promise<AttentionQueue> {
  const [pending, bank, reviews, overdue, support] = await Promise.all([
    prisma.clientWithdrawal.count({ where: { status: "PENDING" } }),
    prisma.clientWithdrawal.count({ where: { status: "PENDING", payout_method: "BANK" } }),
    prisma.verificationRequest.count({ where: { status: "IN_REVIEW" } }),
    prisma.invoice.count({ where: { status: "OPEN", due_at: { lt: new Date() } } }),
    prisma.supportMessage.count({ where: { is_from_admin: false, read_at: null } }),
  ])
  return { withdrawalsToSend: pending, bankWithdrawals: bank, verificationReviews: reviews, overdueInvoices: overdue, unreadSupport: support }
}

export interface RevenueSummary {
  giftsThisMonth: { count: number; amount: number }
  giftFeesThisMonth: number
  subPayThisMonth: number
  activeBadges: number
  pendingPayouts: number
}

export async function getRevenueSummary(): Promise<RevenueSummary> {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [gifts, fees, subPay, activeSubs, payouts] = await Promise.all([
    prisma.donation.aggregate({ where: { status: "COMPLETED", created_at: { gte: monthStart } }, _count: { id: true }, _sum: { amount: true } }),
    prisma.donation.aggregate({ where: { status: "COMPLETED", created_at: { gte: monthStart } }, _sum: { platform_fee: true } }),
    prisma.invoice.aggregate({ where: { status: "PAID", paid_at: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.verificationSubscription.findMany({ where: { status: "ACTIVE" }, select: { current_period_end: true, user: { select: { verified_at: true } } } }),
    prisma.clientWithdrawal.aggregate({ where: { status: { in: ["PENDING", "PROCESSING"] } }, _sum: { net_amount: true } }),
  ])
  return {
    giftsThisMonth: { count: gifts._count.id, amount: gifts._sum.amount ?? 0 },
    giftFeesThisMonth: fees._sum.platform_fee ?? 0,
    subPayThisMonth: subPay._sum.amount ?? 0,
    activeBadges: activeSubs.filter((s) => isBadgeLive(s.user.verified_at, s)).length,
    pendingPayouts: Number(payouts._sum.net_amount ?? 0),
  }
}

export async function getUserDetail(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, username: true, email: true, phone: true, momo_number: true, created_at: true, last_active_at: true,
      deleted_at: true, email_verified_at: true, password_hash: true,
      bank_name: true, bank_account_name: true, bank_account_number: true,
      verified_at: true, verified_name: true,
      profile: { select: { display_name: true, avatar_url: true, bio: true, theme_preset: true, view_count: true, country_code: true } },
      verification_subscription: true,
      _count: { select: { links: true, sessions: true } },
    },
  })
  if (!user) return null

  const [balance, gifts, withdrawals, invoices, verifications, refund] = await Promise.all([
    getClientBalance(userId),
    prisma.donation.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 10,
      select: { id: true, donor_name: true, amount: true, status: true, provider: true, created_at: true },
    }),
    prisma.clientWithdrawal.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 10,
      select: { id: true, amount: true, net_amount: true, status: true, payout_method: true, created_at: true },
    }),
    prisma.invoice.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 10,
      select: { id: true, plan: true, amount: true, status: true, due_at: true, paid_at: true, payment_method: true },
    }),
    prisma.verificationRequest.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 10,
      select: { id: true, status: true, smile_job_id: true, smile_result: true, result_summary: true, created_at: true },
    }),
    getRefundMeter(userId),
  ])

  const { password_hash, ...rest } = user
  return {
    ...rest,
    hasPassword: Boolean(password_hash),
    badgeLive: isBadgeLive(user.verified_at, user.verification_subscription),
    balance,
    gifts,
    withdrawals: withdrawals.map((w) => ({ ...w, amount: Number(w.amount), net_amount: Number(w.net_amount) })),
    invoices,
    verifications,
    refund,
  }
}

// ── Actions ────────────────────────────────────────────────────────────────

export async function revokeBadge(userId: number): Promise<void> {
  await prisma.user.update({ where: { id: userId }, data: { verified_at: null } })
}

export async function signOutEverywhere(userId: number): Promise<number> {
  const { count } = await prisma.session.deleteMany({ where: { user_id: userId } })
  return count
}
