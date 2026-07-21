import { Prisma, AdvertiserPlan, NotificationType } from "@prisma/client"
import { prisma } from "@/lib/db"
import { getSettingAsNumber } from "@/lib/services/platform-settings"
import { createNotification } from "@/lib/services/notification"

type Db = typeof prisma | Prisma.TransactionClient

// One User can belong to at most one Advertiser today (no multi-workspace
// switching yet) — AdvertiserMember is still a join table rather than a
// column on User so Team management (Feature: Business Tier) has somewhere
// to grow into multiple members per advertiser without a schema change.
export async function getAdvertiserForUser(userId: number) {
  const membership = await prisma.advertiserMember.findFirst({
    where: { user_id: userId },
    select: {
      role: true,
      advertiser: {
        select: {
          id: true,
          company_name: true,
          plan: true,
          verification_status: true,
          wallet_balance_ugx: true,
        },
      },
    },
  })
  if (!membership) return null
  return { ...membership.advertiser, role: membership.role }
}

export const PLAN_CAP_MULTIPLIER = {
  STARTUP: 5,
  GROWTH: 10,
  ENTERPRISE: 50,
} as const

// Total additional caps the advertiser has bought in the Credits section,
// on top of what their plan includes.
export async function getPurchasedCredits(advertiserId: number, db: Db = prisma): Promise<number> {
  const agg = await db.advertiserCreditPurchase.aggregate({
    where: { advertiser_id: advertiserId },
    _sum: { credits: true },
  })
  return agg._sum.credits ?? 0
}

// Concurrent-slot cap = plan's included cap (base cap × plan multiplier) plus
// any purchased credits. Single source of truth so booking enforcement and
// the dashboard display can never drift apart.
export async function getEffectiveCap(advertiserId: number, plan: AdvertiserPlan, db: Db = prisma): Promise<number> {
  const [baseCap, credits] = await Promise.all([
    getSettingAsNumber("ad_slot_base_cap", 1),
    getPurchasedCredits(advertiserId, db),
  ])
  return Math.round(baseCap * PLAN_CAP_MULTIPLIER[plan]) + credits
}

// Fans one in-app notification out to every member of an advertiser — the
// account is shared, so a booking/refund event is relevant to the whole
// team, not just whoever triggered it. Best-effort (createNotification
// swallows its own errors), so it never breaks the booking flow it trails.
export async function notifyAdvertiserMembers(
  advertiserId: number,
  notification: { type: NotificationType; title: string; body: string; metadata?: Prisma.InputJsonValue },
): Promise<void> {
  const members = await prisma.advertiserMember.findMany({
    where: { advertiser_id: advertiserId },
    select: { user_id: true },
  })
  await Promise.all(members.map((m) => createNotification({ userId: m.user_id, ...notification })))
}
