import { prisma } from "@/lib/db"
import { pesapal } from "@/lib/services/payments/pesapal"
import { openFloat } from "@/lib/services/payments/openfloat"
import { sendSms } from "@/lib/sms"
import type { Tier, SubscriptionStatus } from "@prisma/client"
import { randomUUID } from "crypto"

export const TIER_PRICES: Record<Exclude<Tier, "FREE">, number> = {
  PRO: 15000,
  BUSINESS: 40000,
  CONTENT_HOUSE: 80000,
}

// Business and Content House get a 5-day free trial before first charge
const TRIAL_TIERS: Tier[] = ["BUSINESS", "CONTENT_HOUSE"]
const TRIAL_DAYS = 5

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function addMonth(date: Date): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + 1)
  return d
}

function pickProvider() {
  const pesapalConfigured = !!(
    process.env.PESAPAL_CONSUMER_KEY && process.env.PESAPAL_CONSUMER_SECRET
  )
  const openFloatConfigured = !!process.env.OPENFLOAT_API_KEY
  if (pesapalConfigured) return pesapal
  if (openFloatConfigured) return openFloat
  return null
}

// Create a subscription record and (for non-trial tiers) fire the STK push.
// Returns the subscription id so the payment page can poll.
export async function initiateSubscription(
  userId: number,
  tier: Exclude<Tier, "FREE">,
  phone: string,
): Promise<{ subscriptionId: number; status: SubscriptionStatus }> {
  const now = new Date()
  const isTrial = TRIAL_TIERS.includes(tier)
  const trialEndsAt = isTrial ? addDays(now, TRIAL_DAYS) : null
  const periodEnd = isTrial ? addDays(now, TRIAL_DAYS) : addMonth(now)
  const idempotencyKey = randomUUID()

  // Upsert — idempotent if user re-attempts
  const existing = await prisma.subscription.findUnique({
    where: { user_id: userId },
  })

  if (existing && (existing.status === "ACTIVE" || existing.status === "TRIALING")) {
    return { subscriptionId: existing.id, status: existing.status }
  }

  const sub = await prisma.subscription.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      tier,
      status: isTrial ? "TRIALING" : "TRIALING", // payment pending until webhook confirms
      trial_ends_at: trialEndsAt,
      current_period_end: periodEnd,
      idempotency_key: idempotencyKey,
    },
    update: {
      tier,
      status: "TRIALING",
      trial_ends_at: trialEndsAt,
      current_period_end: periodEnd,
      idempotency_key: idempotencyKey,
      provider_ref: null,
    },
  })

  await prisma.subscriptionEvent.create({
    data: {
      subscription_id: sub.id,
      event_type: "INITIATED",
      payload: { tier, isTrial, phone },
    },
  })

  if (!isTrial) {
    await fireStkPush(sub.id, userId, tier, phone)
  } else {
    // Upgrade user tier immediately for trial (no payment yet)
    await prisma.user.update({
      where: { id: userId },
      data: { tier },
    })
  }

  return { subscriptionId: sub.id, status: sub.status }
}

// Fire STK push via Pesapal → OpenFloat fallback
async function fireStkPush(
  subscriptionId: number,
  userId: number,
  tier: Exclude<Tier, "FREE">,
  phone: string,
): Promise<void> {
  const provider = pickProvider()
  if (!provider) {
    console.error("No subscription payment provider configured")
    return
  }

  const amount = TIER_PRICES[tier]
  const sub = await prisma.subscription.findUnique({ where: { id: subscriptionId } })
  if (!sub) return

  try {
    const result = await provider.requestToPay({
      phone,
      amount,
      referenceId: sub.idempotency_key,
      payerMessage: `Sub-tree ${tier} subscription`,
    })

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { provider_ref: result.providerTxId ?? null },
    })

    await prisma.subscriptionEvent.create({
      data: {
        subscription_id: subscriptionId,
        event_type: "STK_SENT",
        payload: { providerTxId: result.providerTxId ?? null, phone, amount },
      },
    })
  } catch (err) {
    console.error("Subscription STK push failed", { subscriptionId, err })
    await prisma.subscriptionEvent.create({
      data: {
        subscription_id: subscriptionId,
        event_type: "STK_FAILED",
        payload: { error: String(err) },
      },
    })
  }
}

// Called by the subscription webhook when payment succeeds
export async function activateSubscription(idempotencyKey: string): Promise<void> {
  const sub = await prisma.subscription.findUnique({
    where: { idempotency_key: idempotencyKey },
    include: { user: { select: { phone: true } } },
  })
  if (!sub) return
  if (sub.status === "ACTIVE") return // idempotent

  const now = new Date()
  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: "ACTIVE",
        trial_ends_at: null,
        current_period_end: addMonth(now),
      },
    }),
    prisma.user.update({
      where: { id: sub.user_id },
      data: { tier: sub.tier },
    }),
    prisma.subscriptionEvent.create({
      data: {
        subscription_id: sub.id,
        event_type: "ACTIVATED",
        payload: { activatedAt: now.toISOString() },
      },
    }),
  ])

  if (sub.user.phone) {
    const tierLabel = sub.tier.replace("_", " ").toLowerCase()
    await sendSms(sub.user.phone, `Your Sub-tree ${tierLabel} plan is now active.`)
  }
}

// Called when payment fails or is rejected
export async function failSubscription(idempotencyKey: string): Promise<void> {
  const sub = await prisma.subscription.findUnique({
    where: { idempotency_key: idempotencyKey },
    include: { user: { select: { phone: true } } },
  })
  if (!sub) return

  await prisma.$transaction([
    prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "PAST_DUE" },
    }),
    prisma.user.update({
      where: { id: sub.user_id },
      data: { tier: "FREE" },
    }),
    prisma.subscriptionEvent.create({
      data: {
        subscription_id: sub.id,
        event_type: "PAYMENT_FAILED",
        payload: { at: new Date().toISOString() },
      },
    }),
  ])

  if (sub.user.phone) {
    await sendSms(
      sub.user.phone,
      `Your Sub-tree subscription payment could not be collected. Your account has been moved to the free plan.`,
    )
  }
}

// Daily cron: charge users whose trial has expired + renew active subscriptions
export async function runBillingCycle(): Promise<{ charged: number; failed: number }> {
  const now = new Date()
  let charged = 0
  let failed = 0

  // 1. Trial subscriptions whose trial_ends_at has passed — fire first STK push
  const expiredTrials = await prisma.subscription.findMany({
    where: {
      status: "TRIALING",
      trial_ends_at: { lte: now },
    },
    include: {
      user: { select: { id: true, phone: true, momo_number: true } },
    },
  })

  for (const sub of expiredTrials) {
    const phone = sub.user.momo_number ?? sub.user.phone
    if (!phone) {
      failed++
      continue
    }
    try {
      // Rotate idempotency key for this new charge attempt
      const newKey = randomUUID()
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { idempotency_key: newKey },
      })
      await fireStkPush(sub.id, sub.user.id, sub.tier as Exclude<Tier, "FREE">, phone)
      charged++
    } catch {
      failed++
    }
  }

  // 2. Active subscriptions due for renewal
  const dueRenewals = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      current_period_end: { lte: now },
    },
    include: {
      user: { select: { id: true, phone: true, momo_number: true } },
    },
  })

  for (const sub of dueRenewals) {
    const phone = sub.user.momo_number ?? sub.user.phone
    if (!phone) {
      failed++
      continue
    }
    try {
      const newKey = randomUUID()
      // Move to PAST_DUE until payment confirms via webhook
      await prisma.subscription.update({
        where: { id: sub.id },
        data: {
          status: "PAST_DUE",
          idempotency_key: newKey,
          current_period_end: addMonth(now),
        },
      })
      await fireStkPush(sub.id, sub.user.id, sub.tier as Exclude<Tier, "FREE">, phone)
      charged++
    } catch {
      failed++
    }
  }

  // 3. PAST_DUE subscriptions older than 48 h — downgrade to FREE
  const graceCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000)
  const pastDue = await prisma.subscription.findMany({
    where: {
      status: "PAST_DUE",
      updated_at: { lte: graceCutoff },
    },
    include: { user: { select: { phone: true } } },
  })

  for (const sub of pastDue) {
    await prisma.$transaction([
      prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "CANCELLED" },
      }),
      prisma.user.update({
        where: { id: sub.user_id },
        data: { tier: "FREE" },
      }),
      prisma.subscriptionEvent.create({
        data: {
          subscription_id: sub.id,
          event_type: "DOWNGRADED",
          payload: { reason: "48h grace period elapsed" },
        },
      }),
    ])

    if (sub.user.phone) {
      await sendSms(
        sub.user.phone,
        `Your Sub-tree subscription has expired. Visit sub-tree.com to resubscribe.`,
      )
    }
  }

  return { charged, failed }
}
