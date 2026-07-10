import { prisma } from "@/lib/db"
import { getRateHistory, rateAtTime, getFeeRate } from "@/lib/services/platform-settings"
import { notifyWithdrawalRequested, notifyWithdrawalCompleted, notifyWithdrawalFailed } from "@/lib/services/withdrawal-notify"
import { verifyWithdrawalOtp } from "@/lib/services/withdrawal-otp"

export interface WithdrawalFeeBreakdown {
  amount: number
  platformFee: number
  processorFee: number
  netAmount: number
}

// Creator withdrawals carry both Sub-tree's own withdrawal fee (real platform
// revenue) and Pesapal/OpenFloat's real transfer cost (not Sub-tree revenue —
// money that leaves to the payment processor).
export async function computeWithdrawalFees(amountUgx: number): Promise<WithdrawalFeeBreakdown> {
  const [creatorRate, processorRate] = await Promise.all([
    getFeeRate("fee_withdrawal_creator", 0.02),
    getFeeRate("fee_withdrawal_processor", 0.01),
  ])
  const platformFee = Math.round(amountUgx * creatorRate)
  const processorFee = Math.round(amountUgx * processorRate)
  return { amount: amountUgx, platformFee, processorFee, netAmount: amountUgx - platformFee - processorFee }
}

export class ClientWalletError extends Error {
  constructor(
    public readonly code: "INVALID_AMOUNT" | "INSUFFICIENT_BALANCE",
    message: string,
  ) {
    super(message)
    this.name = "ClientWalletError"
  }
}

interface DonationRow {
  amount: number
  created_at: Date
  fundraiser_id: number | null
  creator_amount: number | null
}

// Donations completed before platform_fee/creator_amount existed have no
// stored split — fall back to the same historical-rate estimate the admin
// Wallet page uses, so old donations still count toward the creator's balance.
async function creatorShareOf(donations: DonationRow[]): Promise<number> {
  const direct = donations.filter((d) => d.fundraiser_id === null && d.creator_amount === null)
  const fundraiser = donations.filter((d) => d.fundraiser_id !== null && d.creator_amount === null)

  const [directPeriods, fundraiserPeriods] = await Promise.all([
    direct.length > 0 ? getRateHistory("fee_donation_free", 0.05) : null,
    fundraiser.length > 0 ? getRateHistory("fee_fundraiser_free", 0.05) : null,
  ])

  return donations.reduce((sum, d) => {
    if (d.creator_amount !== null) return sum + d.creator_amount
    const periods = d.fundraiser_id === null ? directPeriods! : fundraiserPeriods!
    const rate = rateAtTime(periods, d.created_at)
    return sum + Math.round(d.amount * (1 - rate))
  }, 0)
}

async function getWithdrawnTotal(userId: number): Promise<number> {
  const agg = await prisma.clientWithdrawal.aggregate({
    where: { user_id: userId, status: { in: ["PENDING", "COMPLETED"] } },
    _sum: { amount: true },
  })
  return agg._sum.amount ?? 0
}

export async function getClientBalance(userId: number): Promise<{ earned: number; withdrawn: number; available: number }> {
  const donations = await prisma.donation.findMany({
    where: { user_id: userId, status: "COMPLETED" },
    select: { amount: true, created_at: true, fundraiser_id: true, creator_amount: true },
  })

  const [earned, withdrawn] = await Promise.all([
    creatorShareOf(donations),
    getWithdrawnTotal(userId),
  ])

  return { earned, withdrawn, available: earned - withdrawn }
}

export async function listClientWithdrawals(userId: number, limit = 20) {
  return prisma.clientWithdrawal.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true, amount: true, platform_fee_amount: true, processor_fee_amount: true,
      net_amount: true, status: true, created_at: true, completed_at: true,
    },
  })
}

// Records the request only — no OpenFloat payout call yet, same as the admin
// wallet, until that integration is provided. otpCode must be a valid,
// unexpired, unconsumed code sent via sendWithdrawalOtp — throws
// WithdrawalOtpError otherwise.
export async function requestClientWithdrawal(userId: number, amountUgx: number, otpCode: string): Promise<void> {
  if (!Number.isFinite(amountUgx) || amountUgx <= 0) {
    throw new ClientWalletError("INVALID_AMOUNT", "Amount must be a positive number")
  }

  await verifyWithdrawalOtp(userId, otpCode)

  const { available } = await getClientBalance(userId)
  if (amountUgx > available) {
    throw new ClientWalletError(
      "INSUFFICIENT_BALANCE",
      `Only UGX ${Math.round(available).toLocaleString()} is available to withdraw`,
    )
  }

  const rounded = Math.round(amountUgx)
  const fees = await computeWithdrawalFees(rounded)

  await prisma.clientWithdrawal.create({
    data: {
      amount: rounded,
      platform_fee_amount: fees.platformFee,
      processor_fee_amount: fees.processorFee,
      net_amount: fees.netAmount,
      user_id: userId,
    },
  })

  await notifyWithdrawalRequested({
    userId,
    amount: rounded,
    platformFee: fees.platformFee,
    processorFee: fees.processorFee,
    netAmount: fees.netAmount,
  })
}

// Admin-facing: every creator's withdrawal requests, for manual fulfillment
// until the real OpenFloat/Pesapal payout API is wired in.
export async function listAllClientWithdrawals(limit = 50) {
  return prisma.clientWithdrawal.findMany({
    orderBy: { created_at: "desc" },
    take: limit,
    select: {
      id: true, amount: true, platform_fee_amount: true, processor_fee_amount: true,
      net_amount: true, status: true, created_at: true, completed_at: true, user_id: true,
      user: { select: { username: true, email: true } },
    },
  })
}

export async function markClientWithdrawalCompleted(withdrawalId: number): Promise<void> {
  const withdrawal = await prisma.clientWithdrawal.update({
    where: { id: withdrawalId, status: "PENDING" },
    data: { status: "COMPLETED", completed_at: new Date() },
  })

  await notifyWithdrawalCompleted({
    userId: withdrawal.user_id,
    amount: withdrawal.amount,
    platformFee: withdrawal.platform_fee_amount,
    processorFee: withdrawal.processor_fee_amount,
    netAmount: withdrawal.net_amount,
  })
}

export async function markClientWithdrawalFailed(withdrawalId: number): Promise<void> {
  const withdrawal = await prisma.clientWithdrawal.update({
    where: { id: withdrawalId, status: "PENDING" },
    data: { status: "FAILED", completed_at: new Date() },
  })

  await notifyWithdrawalFailed(withdrawal.user_id, withdrawal.amount)
}
