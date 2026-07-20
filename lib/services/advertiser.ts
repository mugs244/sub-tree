import { prisma } from "@/lib/db"

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
