import { randomUUID } from "crypto"
import { AdvertiserPaymentKind, AdvertiserPlan } from "@prisma/client"
import { prisma } from "@/lib/db"
import { submitOrder } from "@/lib/services/payments/pesapal"
import { getSettingAsNumber } from "@/lib/services/platform-settings"
import { notifyAdvertiserMembers } from "@/lib/services/advertiser"
import type { MomoCallbackPayload } from "@/lib/services/momo/types"

const APP_BASE_URL = process.env.APP_BASE_URL ?? "https://sub-tree.com"

// Monthly subscription fee per plan — higher tiers cost more. Configurable.
const PLAN_FEE_DEFAULTS: Record<AdvertiserPlan, number> = {
  STARTUP: 100_000,
  GROWTH: 250_000,
  ENTERPRISE: 750_000,
}

export async function getAdvertiserPlanFee(plan: AdvertiserPlan): Promise<number> {
  return getSettingAsNumber(`advertiser_plan_fee_${plan.toLowerCase()}`, PLAN_FEE_DEFAULTS[plan])
}

export class AdvertiserPaymentError extends Error {
  constructor(public readonly code: "INVALID_AMOUNT" | "NOT_CONFIGURED", message: string) {
    super(message)
    this.name = "AdvertiserPaymentError"
  }
}

function pesapalConfigured(): boolean {
  return !!(process.env.PESAPAL_CONSUMER_KEY && process.env.PESAPAL_CONSUMER_SECRET)
}

function addMonth(date: Date): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1)
  return d
}

// Creates a pending payment and hands back Pesapal's hosted-checkout redirect
// URL. The caller sends the advertiser there; the IPN webhook settles it later
// via handleAdvertiserPaymentCallback. Throws NOT_CONFIGURED when Pesapal keys
// are absent so callers can surface a clear message instead of a broken flow.
export async function initiateAdvertiserPayment(params: {
  advertiserId: number
  kind: AdvertiserPaymentKind
  amountUgx: number
  phone?: string
  note?: string
}): Promise<{ paymentId: number; redirectUrl: string }> {
  const { advertiserId, kind, amountUgx, phone, note } = params
  if (!Number.isFinite(amountUgx) || amountUgx <= 0) {
    throw new AdvertiserPaymentError("INVALID_AMOUNT", "Amount must be a positive number")
  }
  if (!pesapalConfigured()) {
    throw new AdvertiserPaymentError("NOT_CONFIGURED", "Card/mobile-money payment isn't set up yet")
  }

  const rounded = Math.round(amountUgx)
  const idempotencyKey = randomUUID()

  const payment = await prisma.advertiserPayment.create({
    data: { advertiser_id: advertiserId, kind, amount_ugx: rounded, idempotency_key: idempotencyKey, note },
  })

  const callbackUrl = `${APP_BASE_URL}/business/payment/complete?ref=${idempotencyKey}`
  const result = await submitOrder(
    {
      amount: rounded,
      phone,
      referenceId: idempotencyKey,
      payerMessage: kind === "SUBSCRIPTION" ? "Sub-tree advertiser subscription" : "Sub-tree wallet top-up",
    },
    callbackUrl,
  )

  if (result.orderTrackingId) {
    await prisma.advertiserPayment.update({
      where: { id: payment.id },
      data: { provider_tx_id: result.orderTrackingId },
    })
  }

  if (!result.redirectUrl) {
    throw new AdvertiserPaymentError("NOT_CONFIGURED", "Payment provider did not return a checkout URL")
  }

  return { paymentId: payment.id, redirectUrl: result.redirectUrl }
}

// IPN webhook entry point — settles the payment the reference points at.
// Idempotent: unknown or already-settled references are ignored so provider
// retries can't double-credit.
export async function handleAdvertiserPaymentCallback(payload: MomoCallbackPayload): Promise<void> {
  const { referenceId, status, providerTxId } = payload

  const payment = await prisma.advertiserPayment.findUnique({
    where: { idempotency_key: referenceId },
    select: { id: true, advertiser_id: true, kind: true, amount_ugx: true, status: true },
  })
  if (!payment) return
  if (payment.status !== "PENDING") return

  if (status !== "SUCCESSFUL") {
    await prisma.advertiserPayment.update({
      where: { id: payment.id },
      data: { status: "FAILED", completed_at: new Date(), ...(providerTxId ? { provider_tx_id: providerTxId } : {}) },
    })
    return
  }

  await prisma.$transaction(async (tx) => {
    // Guard against a concurrent settlement — only proceed if still PENDING.
    const claimed = await tx.advertiserPayment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "COMPLETED", completed_at: new Date(), ...(providerTxId ? { provider_tx_id: providerTxId } : {}) },
    })
    if (claimed.count === 0) return

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${payment.advertiser_id})`
    const advertiser = await tx.advertiser.findUniqueOrThrow({ where: { id: payment.advertiser_id } })

    if (payment.kind === "WALLET_TOPUP") {
      const balanceAfter = advertiser.wallet_balance_ugx + BigInt(payment.amount_ugx)
      await tx.advertiser.update({ where: { id: advertiser.id }, data: { wallet_balance_ugx: balanceAfter } })
      await tx.advertiserWalletTransaction.create({
        data: {
          advertiser_id: advertiser.id,
          type: "TOPUP",
          amount_ugx: payment.amount_ugx,
          balance_after_ugx: balanceAfter,
          note: "Wallet top-up (Pesapal)",
        },
      })
    } else {
      // SUBSCRIPTION — extend the paid period by a month from whichever is later.
      const from = advertiser.subscription_active_until && advertiser.subscription_active_until > new Date()
        ? advertiser.subscription_active_until
        : new Date()
      await tx.advertiser.update({
        where: { id: advertiser.id },
        data: { subscription_active_until: addMonth(from) },
      })
    }
  })

  await notifyAdvertiserMembers(payment.advertiser_id, {
    type: "ANNOUNCEMENT",
    title: payment.kind === "WALLET_TOPUP" ? "Wallet topped up" : "Subscription active",
    body:
      payment.kind === "WALLET_TOPUP"
        ? `UGX ${payment.amount_ugx.toLocaleString()} was added to your wallet.`
        : "Your subscription payment was received — your plan is active.",
    metadata: { paymentId: payment.id, kind: payment.kind },
  })
}

export async function getAdvertiserPaymentStatus(advertiserId: number, paymentId: number) {
  return prisma.advertiserPayment.findFirst({
    where: { id: paymentId, advertiser_id: advertiserId },
    select: { id: true, kind: true, amount_ugx: true, status: true, created_at: true, completed_at: true },
  })
}
