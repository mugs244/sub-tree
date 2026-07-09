import { prisma } from "@/lib/db"
import { getRateHistory, rateAtTime } from "@/lib/services/platform-settings"

export class WalletError extends Error {
  constructor(
    public readonly code: "INVALID_AMOUNT" | "INSUFFICIENT_BALANCE",
    message: string,
  ) {
    super(message)
    this.name = "WalletError"
  }
}

async function estimateFeeRevenue(
  donations: { amount: number; created_at: Date }[],
  rateKey: string,
): Promise<number> {
  if (donations.length === 0) return 0
  const periods = await getRateHistory(rateKey, 0.05)
  return donations.reduce((sum, d) => sum + d.amount * rateAtTime(periods, d.created_at), 0)
}

export interface PlatformRevenue {
  shopFeeRevenue: number
  shopVolume: number
  shopOrderCount: number
  donationFeeEstimate: number
  directDonationCount: number
  fundraiserFeeEstimate: number
  fundraiserDonationCount: number
  totalDonationVolume: number
  totalPlatformRevenue: number
}

// Total fee revenue Sub-tree has collected across every source. Shop fees are
// exact (platform_fee is stored per order); donation/fundraiser fees are
// estimated by pricing each donation against whatever rate was actually in
// effect on its date (see platform-settings.getRateHistory).
export async function computePlatformRevenue(): Promise<PlatformRevenue> {
  const [shopAgg, completedDonations] = await Promise.all([
    prisma.order.aggregate({
      where: { payment_confirmed: true },
      _sum: { platform_fee: true, amount_paid: true },
      _count: { id: true },
    }),
    prisma.donation.findMany({
      where: { status: "COMPLETED" },
      select: { amount: true, created_at: true, fundraiser_id: true },
    }),
  ])

  const directDonations = completedDonations.filter((d) => d.fundraiser_id === null)
  const fundraiserDonations = completedDonations.filter((d) => d.fundraiser_id !== null)

  const [donationFeeEstimate, fundraiserFeeEstimate] = await Promise.all([
    estimateFeeRevenue(directDonations, "fee_donation_free"),
    estimateFeeRevenue(fundraiserDonations, "fee_fundraiser_free"),
  ])

  const shopFeeRevenue = Number(shopAgg._sum.platform_fee ?? BigInt(0))
  const shopVolume = Number(shopAgg._sum.amount_paid ?? BigInt(0))
  const totalDonationVolume = completedDonations.reduce((sum, d) => sum + d.amount, 0)

  return {
    shopFeeRevenue,
    shopVolume,
    shopOrderCount: shopAgg._count.id,
    donationFeeEstimate,
    directDonationCount: directDonations.length,
    fundraiserFeeEstimate,
    fundraiserDonationCount: fundraiserDonations.length,
    totalDonationVolume,
    totalPlatformRevenue: shopFeeRevenue + donationFeeEstimate + fundraiserFeeEstimate,
  }
}

// Sum of withdrawals that have already claimed part of the collected
// revenue — PENDING counts too, since that money is earmarked the moment
// it's requested, not just once fulfilled.
async function getWithdrawnTotal(): Promise<number> {
  const agg = await prisma.walletWithdrawal.aggregate({
    where: { status: { in: ["PENDING", "COMPLETED"] } },
    _sum: { amount: true },
  })
  return Number(agg._sum.amount ?? BigInt(0))
}

export async function getAvailableBalance(): Promise<{ totalRevenue: number; withdrawn: number; available: number }> {
  const [revenue, withdrawn] = await Promise.all([computePlatformRevenue(), getWithdrawnTotal()])
  const totalRevenue = revenue.totalPlatformRevenue
  return { totalRevenue, withdrawn, available: totalRevenue - withdrawn }
}

export async function listWithdrawals(limit = 20) {
  return prisma.walletWithdrawal.findMany({
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true,
      amount: true,
      status: true,
      note: true,
      created_at: true,
      completed_at: true,
      admin: { select: { username: true, email: true } },
    },
  })
}

// Records the request only — no external API call yet. The real Pesapal
// payout call gets wired in here once that integration is provided; until
// then this is fulfilled manually and marked COMPLETED/FAILED by hand.
export async function requestWithdrawal(adminUserId: number, amountUgx: number): Promise<void> {
  if (!Number.isFinite(amountUgx) || amountUgx <= 0) {
    throw new WalletError("INVALID_AMOUNT", "Amount must be a positive number")
  }

  const { available } = await getAvailableBalance()
  if (amountUgx > available) {
    throw new WalletError(
      "INSUFFICIENT_BALANCE",
      `Only UGX ${Math.round(available).toLocaleString()} is available to withdraw`,
    )
  }

  await prisma.walletWithdrawal.create({
    data: {
      amount: BigInt(Math.round(amountUgx)),
      requested_by: adminUserId,
    },
  })
}
