import { prisma } from "@/lib/db"
import { getRateHistory, rateAtTime, getFeeRate } from "@/lib/services/platform-settings"
import { notifyWithdrawalRequested, notifyWithdrawalCompleted, notifyWithdrawalFailed } from "@/lib/services/withdrawal-notify"
import { verifyWithdrawalOtp } from "@/lib/services/withdrawal-otp"
import { createNotification } from "@/lib/services/notification"

function fmt(v: number): string {
  return `UGX ${Math.round(v).toLocaleString()}`
}

export interface WithdrawalFeeBreakdown {
  amount: number
  processorFee: number
  netAmount: number
}

// The admin sweep is Sub-tree's own money, so only the payment processor's
// real transfer cost applies — no additional platform markup on itself.
export async function computeSweepFees(amountUgx: number): Promise<WithdrawalFeeBreakdown> {
  const processorRate = await getFeeRate("fee_withdrawal_processor", 0.01)
  const processorFee = Math.round(amountUgx * processorRate)
  return { amount: amountUgx, processorFee, netAmount: amountUgx - processorFee }
}

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
  withdrawalFeeRevenue: number
  withdrawalCount: number
  totalDonationVolume: number
  totalPlatformRevenue: number
}

// Total fee revenue Sub-tree has collected across every source. Shop fees are
// exact (platform_fee is stored per order); donation/fundraiser fees are
// estimated by pricing each donation against whatever rate was actually in
// effect on its date (see platform-settings.getRateHistory). Withdrawal fees
// are exact — platform_fee_amount is stored per ClientWithdrawal request.
export async function computePlatformRevenue(): Promise<PlatformRevenue> {
  const [shopAgg, completedDonations, withdrawalAgg] = await Promise.all([
    prisma.order.aggregate({
      where: { payment_confirmed: true },
      _sum: { platform_fee: true, amount_paid: true },
      _count: { id: true },
    }),
    prisma.donation.findMany({
      where: { status: "COMPLETED" },
      select: { amount: true, created_at: true, fundraiser_id: true },
    }),
    prisma.clientWithdrawal.aggregate({
      where: { status: { in: ["PENDING", "COMPLETED"] } },
      _sum: { platform_fee_amount: true },
      _count: { id: true },
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
  const withdrawalFeeRevenue = withdrawalAgg._sum.platform_fee_amount ?? 0

  return {
    shopFeeRevenue,
    shopVolume,
    shopOrderCount: shopAgg._count.id,
    donationFeeEstimate,
    directDonationCount: directDonations.length,
    fundraiserFeeEstimate,
    fundraiserDonationCount: fundraiserDonations.length,
    withdrawalFeeRevenue,
    withdrawalCount: withdrawalAgg._count.id,
    totalDonationVolume,
    totalPlatformRevenue: shopFeeRevenue + donationFeeEstimate + fundraiserFeeEstimate + withdrawalFeeRevenue,
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
      processor_fee_amount: true,
      net_amount: true,
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
// otpCode must be a valid, unexpired, unconsumed code sent via
// sendWithdrawalOtp — throws WithdrawalOtpError otherwise.
export async function requestWithdrawal(adminUserId: number, amountUgx: number, otpCode: string): Promise<void> {
  if (!Number.isFinite(amountUgx) || amountUgx <= 0) {
    throw new WalletError("INVALID_AMOUNT", "Amount must be a positive number")
  }

  await verifyWithdrawalOtp(adminUserId, otpCode)

  const { available } = await getAvailableBalance()
  if (amountUgx > available) {
    throw new WalletError(
      "INSUFFICIENT_BALANCE",
      `Only UGX ${Math.round(available).toLocaleString()} is available to withdraw`,
    )
  }

  const rounded = Math.round(amountUgx)
  const fees = await computeSweepFees(rounded)

  await prisma.walletWithdrawal.create({
    data: {
      amount: BigInt(rounded),
      processor_fee_amount: BigInt(fees.processorFee),
      net_amount: BigInt(fees.netAmount),
      requested_by: adminUserId,
    },
  })

  await notifyWithdrawalRequested({
    userId: adminUserId,
    amount: rounded,
    platformFee: 0,
    processorFee: fees.processorFee,
    netAmount: fees.netAmount,
  })

  await createNotification({
    userId: adminUserId,
    type: "WITHDRAWAL_REQUESTED",
    title: `Platform sweep submitted — ${fmt(rounded)}`,
    body: `Your request to sweep ${fmt(rounded)} to the Pesapal wallet is pending.`,
    metadata: { amount: rounded, netAmount: fees.netAmount },
  })
}

export async function markWithdrawalCompleted(withdrawalId: number): Promise<void> {
  const withdrawal = await prisma.walletWithdrawal.update({
    where: { id: withdrawalId, status: "PENDING" },
    data: { status: "COMPLETED", completed_at: new Date() },
  })

  await notifyWithdrawalCompleted({
    userId: withdrawal.requested_by,
    amount: Number(withdrawal.amount),
    platformFee: 0,
    processorFee: Number(withdrawal.processor_fee_amount),
    netAmount: Number(withdrawal.net_amount),
  })

  await createNotification({
    userId: withdrawal.requested_by,
    type: "WITHDRAWAL_COMPLETED",
    title: `Platform sweep complete — ${fmt(Number(withdrawal.net_amount))}`,
    body: `Your sweep of ${fmt(Number(withdrawal.amount))} to the Pesapal wallet is complete.`,
    metadata: { withdrawalId, amount: Number(withdrawal.amount) },
  })
}

export async function markWithdrawalFailed(withdrawalId: number): Promise<void> {
  const withdrawal = await prisma.walletWithdrawal.update({
    where: { id: withdrawalId, status: "PENDING" },
    data: { status: "FAILED", completed_at: new Date() },
  })

  await notifyWithdrawalFailed(withdrawal.requested_by, Number(withdrawal.amount))

  await createNotification({
    userId: withdrawal.requested_by,
    type: "WITHDRAWAL_FAILED",
    title: `Platform sweep failed — ${fmt(Number(withdrawal.amount))}`,
    body: `Your sweep of ${fmt(Number(withdrawal.amount))} could not be completed.`,
    metadata: { withdrawalId, amount: Number(withdrawal.amount) },
  })
}
