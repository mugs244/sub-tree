import { randomUUID } from "crypto"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { getRateHistory, rateAtTime, getFeeRate } from "@/lib/services/platform-settings"
import { notifyWithdrawalRequested, notifyWithdrawalCompleted, notifyWithdrawalFailed } from "@/lib/services/withdrawal-notify"
import { verifyWithdrawalOtp } from "@/lib/services/withdrawal-otp"
import { createNotification } from "@/lib/services/notification"
import { openFloatPayout } from "@/lib/services/payments/openfloat"
import type { MomoCallbackPayload } from "@/lib/services/momo/types"

function fmt(v: number): string {
  return `UGX ${Math.round(v).toLocaleString()}`
}

type Db = typeof prisma | Prisma.TransactionClient

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
    public readonly code: "INVALID_AMOUNT" | "INSUFFICIENT_BALANCE" | "NOT_FOUND",
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

async function getWithdrawnTotal(userId: number, db: Db): Promise<number> {
  const agg = await db.clientWithdrawal.aggregate({
    where: { user_id: userId, status: { in: ["PENDING", "PROCESSING", "COMPLETED"] } },
    _sum: { amount: true },
  })
  return agg._sum.amount ?? 0
}

export async function getClientBalance(userId: number, db: Db = prisma): Promise<{ earned: number; withdrawn: number; available: number }> {
  const donations = await db.donation.findMany({
    where: { user_id: userId, status: "COMPLETED" },
    select: { amount: true, created_at: true, fundraiser_id: true, creator_amount: true },
  })

  const [earned, withdrawn] = await Promise.all([
    creatorShareOf(donations),
    getWithdrawnTotal(userId, db),
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

// otpCode must be a valid, unexpired, unconsumed code sent via
// sendWithdrawalOtp — throws WithdrawalOtpError otherwise. The balance check
// and insert run inside a Postgres advisory lock scoped to this user, so two
// concurrent requests can never both pass the check against the same funds —
// the second waits for the first's transaction to commit, then reads its
// up-to-date withdrawn total.
export async function requestClientWithdrawal(userId: number, amountUgx: number, otpCode: string): Promise<void> {
  if (!Number.isFinite(amountUgx) || amountUgx <= 0) {
    throw new ClientWalletError("INVALID_AMOUNT", "Amount must be a positive number")
  }

  await verifyWithdrawalOtp(userId, otpCode)

  const rounded = Math.round(amountUgx)
  const fees = await computeWithdrawalFees(rounded)

  const withdrawal = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${userId})`

    const { available } = await getClientBalance(userId, tx)
    if (rounded > available) {
      throw new ClientWalletError(
        "INSUFFICIENT_BALANCE",
        `Only UGX ${Math.round(available).toLocaleString()} is available to withdraw`,
      )
    }

    return tx.clientWithdrawal.create({
      data: {
        amount: rounded,
        platform_fee_amount: fees.platformFee,
        processor_fee_amount: fees.processorFee,
        net_amount: fees.netAmount,
        user_id: userId,
        idempotency_key: randomUUID(),
      },
    })
  })

  await notifyWithdrawalRequested({
    userId,
    amount: rounded,
    platformFee: fees.platformFee,
    processorFee: fees.processorFee,
    netAmount: fees.netAmount,
  })

  await createNotification({
    userId,
    type: "WITHDRAWAL_REQUESTED",
    title: `Withdrawal request submitted — ${fmt(rounded)}`,
    body: `Your request to withdraw ${fmt(rounded)} is pending. You'll receive ${fmt(fees.netAmount)} after fees.`,
    metadata: { amount: rounded, netAmount: fees.netAmount },
  })

  await attemptClientWithdrawalPayout(withdrawal.id)
}

// Fires the real OpenFloat payout right after a withdrawal is recorded, so
// creators no longer wait on admin approval. Falls back to leaving the
// request PENDING for manual admin fulfillment when OpenFloat isn't
// configured in this environment (same graceful-degradation pattern used by
// the donation collection chain) — everything else (bad/missing payout
// number, a synchronous provider error) fails the withdrawal outright so the
// creator is notified immediately instead of waiting indefinitely.
async function attemptClientWithdrawalPayout(withdrawalId: number): Promise<void> {
  const withdrawal = await prisma.clientWithdrawal.findUnique({
    where: { id: withdrawalId },
    select: { user_id: true, net_amount: true, idempotency_key: true },
  })
  if (!withdrawal) return

  const user = await prisma.user.findUnique({
    where: { id: withdrawal.user_id },
    select: { momo_number: true, phone: true },
  })
  const phone = user?.momo_number ?? user?.phone

  if (!phone) {
    await markClientWithdrawalFailed(
      withdrawalId,
      "No mobile money number on file — add one in Settings and request the withdrawal again.",
    )
    return
  }

  if (!process.env.OPENFLOAT_API_KEY) {
    console.error("Client withdrawal payout skipped — OpenFloat not configured", withdrawalId)
    return
  }

  try {
    const result = await openFloatPayout.payout({
      amount: withdrawal.net_amount,
      phone,
      referenceId: withdrawal.idempotency_key!,
      payerMessage: "Sub-tree withdrawal",
    })

    await prisma.clientWithdrawal.updateMany({
      where: { id: withdrawalId, status: "PENDING" },
      data: { status: "PROCESSING", ...(result.providerTxId ? { provider_tx_id: result.providerTxId } : {}) },
    })
  } catch (err) {
    console.error("Client withdrawal payout failed to initiate", withdrawalId, err)
    await markClientWithdrawalFailed(withdrawalId, "Could not reach the payment processor — please contact support.")
  }
}

// OpenFloat payout webhook entry point — looks the withdrawal up by the
// idempotency_key we sent as the payout reference, same pattern as
// handleMomoCallback for donations. Idempotent: unknown or already-settled
// references are ignored so provider webhook retries can't double-process.
export async function handleClientWithdrawalPayoutCallback(payload: MomoCallbackPayload): Promise<void> {
  const { referenceId, status, providerTxId, reason } = payload

  const withdrawal = await prisma.clientWithdrawal.findUnique({
    where: { idempotency_key: referenceId },
    select: { id: true, status: true },
  })
  if (!withdrawal) return

  if (withdrawal.status === "COMPLETED" || withdrawal.status === "FAILED") return

  if (status === "SUCCESSFUL") {
    await markClientWithdrawalCompleted(withdrawal.id, providerTxId)
  } else {
    await markClientWithdrawalFailed(withdrawal.id, reason ?? "The payment processor reported the transfer failed.")
  }
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

// Guards the transition against a stale/duplicate call (webhook retry, or an
// admin acting on a request the webhook already resolved) — throws NOT_FOUND
// instead of silently double-processing when the withdrawal isn't in an
// actionable state.
async function transitionClientWithdrawal(
  withdrawalId: number,
  data: Prisma.ClientWithdrawalUpdateManyMutationInput,
) {
  const result = await prisma.clientWithdrawal.updateMany({
    where: { id: withdrawalId, status: { in: ["PENDING", "PROCESSING"] } },
    data,
  })
  if (result.count === 0) {
    throw new ClientWalletError("NOT_FOUND", "Withdrawal not found or already processed")
  }
  return prisma.clientWithdrawal.findUniqueOrThrow({ where: { id: withdrawalId } })
}

// Fired once the payout is confirmed — by the OpenFloat webhook, or by an
// admin manually resolving a request that never got automated (no provider
// configured, or a stuck PROCESSING request).
export async function markClientWithdrawalCompleted(withdrawalId: number, providerTxId?: string): Promise<void> {
  const withdrawal = await transitionClientWithdrawal(withdrawalId, {
    status: "COMPLETED",
    completed_at: new Date(),
    ...(providerTxId ? { provider_tx_id: providerTxId } : {}),
  })

  await notifyWithdrawalCompleted({
    userId: withdrawal.user_id,
    amount: withdrawal.amount,
    platformFee: withdrawal.platform_fee_amount,
    processorFee: withdrawal.processor_fee_amount,
    netAmount: withdrawal.net_amount,
  })

  await createNotification({
    userId: withdrawal.user_id,
    type: "WITHDRAWAL_COMPLETED",
    title: `Withdrawal complete — ${fmt(withdrawal.net_amount)}`,
    body: `Your withdrawal of ${fmt(withdrawal.amount)} is complete. ${fmt(withdrawal.net_amount)} was sent after fees.`,
    metadata: { withdrawalId, amount: withdrawal.amount, netAmount: withdrawal.net_amount },
  })
}

export async function markClientWithdrawalFailed(withdrawalId: number, reason?: string): Promise<void> {
  const withdrawal = await transitionClientWithdrawal(withdrawalId, {
    status: "FAILED",
    completed_at: new Date(),
    ...(reason ? { note: reason } : {}),
  })

  await notifyWithdrawalFailed(withdrawal.user_id, withdrawal.amount)

  await createNotification({
    userId: withdrawal.user_id,
    type: "WITHDRAWAL_FAILED",
    title: `Withdrawal failed — ${fmt(withdrawal.amount)}`,
    body: reason
      ? `Your withdrawal of ${fmt(withdrawal.amount)} could not be completed: ${reason}`
      : `Your withdrawal of ${fmt(withdrawal.amount)} could not be completed. Please check your details or contact support.`,
    metadata: { withdrawalId, amount: withdrawal.amount },
  })
}
