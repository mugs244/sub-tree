import { prisma } from "@/lib/db"
import { z } from "zod"

export class AffiliateError extends Error {
  constructor(
    public readonly code:
      | "USER_NOT_FOUND"
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "VALIDATION_ERROR"
      | "SELF_REFERRAL"
      | "ALREADY_EXISTS"
      | "WRONG_TIER"
      | "NOT_PENDING"
      | "NOT_APPROVED",
    message: string,
  ) {
    super(message)
    this.name = "AffiliateError"
  }
}

const PRO_TIERS = ["PRO", "BUSINESS", "CONTENT_HOUSE"]
const BUSINESS_TIERS = ["BUSINESS", "CONTENT_HOUSE"]
const MIN_PAYOUT_UGX = 5000

// ── Validators ────────────────────────────────────────────────────────────────

export const approveRequestSchema = z.object({
  product_ids: z.array(z.number().int().positive()).min(1, "Select at least one product"),
})

export const rejectRequestSchema = z.object({
  reason: z.string().max(500).optional(),
})

export const inviteSchema = z.object({
  affiliate_handle: z.string().min(1, "Handle required"),
  product_ids:      z.array(z.number().int().positive()).min(1, "Select at least one product"),
})

export const updateGrantsSchema = z.object({
  product_ids: z.array(z.number().int().positive()),
})

export const productAffiliateSchema = z.object({
  affiliate_rate: z.number().min(0).max(0.5),
  affiliate_open: z.boolean(),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolveUser(clerkUserId: string) {
  const user = await prisma.user.findUnique({
    where: { clerk_user_id: clerkUserId },
    select: { id: true, tier: true, username: true },
  })
  if (!user) throw new AffiliateError("USER_NOT_FOUND", "User record not found")
  return user
}

// ── Merchant side ─────────────────────────────────────────────────────────────

export async function listInboundRequests(clerkUserId: string) {
  const user = await resolveUser(clerkUserId)
  return prisma.affiliateRelationship.findMany({
    where: { shop_user_id: user.id, status: "PENDING" },
    orderBy: { created_at: "desc" },
    select: {
      id: true, initiated_by: true, requested_at: true,
      affiliate_user: {
        select: { username: true, profile: { select: { display_name: true, avatar_url: true } } },
      },
    },
  })
}

export async function listAllAffiliates(clerkUserId: string) {
  const user = await resolveUser(clerkUserId)
  return prisma.affiliateRelationship.findMany({
    where: { shop_user_id: user.id, status: "APPROVED" },
    orderBy: { reviewed_at: "desc" },
    select: {
      id: true, reviewed_at: true,
      affiliate_user: {
        select: { username: true, profile: { select: { display_name: true, avatar_url: true } } },
      },
      product_grants: {
        where: { revoked_at: null },
        select: { product: { select: { id: true, name: true } } },
      },
    },
  })
}

export async function approveRequest(clerkUserId: string, relationshipId: number, input: unknown) {
  const parsed = approveRequestSchema.safeParse(input)
  if (!parsed.success) {
    throw new AffiliateError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const user = await resolveUser(clerkUserId)
  const rel = await prisma.affiliateRelationship.findUnique({ where: { id: relationshipId } })
  if (!rel) throw new AffiliateError("NOT_FOUND", "Relationship not found")
  if (rel.shop_user_id !== user.id) throw new AffiliateError("FORBIDDEN", "Not your relationship")
  if (rel.status !== "PENDING") throw new AffiliateError("NOT_PENDING", "Request is not pending")

  // Verify all product_ids belong to this merchant and are affiliate_open
  const products = await prisma.product.findMany({
    where: { id: { in: parsed.data.product_ids }, user_id: user.id, affiliate_open: true },
    select: { id: true },
  })
  const validIds = products.map((p) => p.id)

  await prisma.$transaction(async (tx) => {
    await tx.affiliateRelationship.update({
      where: { id: relationshipId },
      data: { status: "APPROVED", reviewed_at: new Date() },
    })
    await tx.affiliateProductGrant.createMany({
      data: validIds.map((product_id) => ({ relationship_id: relationshipId, product_id })),
      skipDuplicates: true,
    })
  })
}

export async function rejectRequest(clerkUserId: string, relationshipId: number, input: unknown) {
  const parsed = rejectRequestSchema.safeParse(input)
  if (!parsed.success) {
    throw new AffiliateError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const user = await resolveUser(clerkUserId)
  const rel = await prisma.affiliateRelationship.findUnique({ where: { id: relationshipId } })
  if (!rel) throw new AffiliateError("NOT_FOUND", "Relationship not found")
  if (rel.shop_user_id !== user.id) throw new AffiliateError("FORBIDDEN", "Not your relationship")
  if (rel.status !== "PENDING") throw new AffiliateError("NOT_PENDING", "Request is not pending")

  await prisma.affiliateRelationship.update({
    where: { id: relationshipId },
    data: {
      status: "REJECTED",
      reviewed_at: new Date(),
      rejected_reason: parsed.data.reason ?? null,
    },
  })
}

export async function inviteAffiliate(clerkUserId: string, input: unknown) {
  const parsed = inviteSchema.safeParse(input)
  if (!parsed.success) {
    throw new AffiliateError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const user = await resolveUser(clerkUserId)
  if (!BUSINESS_TIERS.includes(user.tier)) {
    throw new AffiliateError("WRONG_TIER", "Business tier required to invite affiliates")
  }

  const target = await prisma.user.findUnique({
    where: { username: parsed.data.affiliate_handle },
    select: { id: true, tier: true },
  })
  if (!target) throw new AffiliateError("NOT_FOUND", "Creator not found")
  if (target.id === user.id) throw new AffiliateError("SELF_REFERRAL", "Cannot affiliate with yourself")
  if (!PRO_TIERS.includes(target.tier)) {
    throw new AffiliateError("WRONG_TIER", "Target must be a Pro or higher creator")
  }

  const existing = await prisma.affiliateRelationship.findUnique({
    where: { shop_user_id_affiliate_user_id: { shop_user_id: user.id, affiliate_user_id: target.id } },
  })
  if (existing) throw new AffiliateError("ALREADY_EXISTS", "Relationship already exists")

  const products = await prisma.product.findMany({
    where: { id: { in: parsed.data.product_ids }, user_id: user.id, affiliate_open: true },
    select: { id: true },
  })
  const validIds = products.map((p) => p.id)

  await prisma.$transaction(async (tx) => {
    const rel = await tx.affiliateRelationship.create({
      data: {
        shop_user_id: user.id,
        affiliate_user_id: target.id,
        initiated_by: "MERCHANT_INVITE",
        status: "APPROVED",
        reviewed_at: new Date(),
      },
    })
    await tx.affiliateProductGrant.createMany({
      data: validIds.map((product_id) => ({ relationship_id: rel.id, product_id })),
      skipDuplicates: true,
    })
  })
}

export async function updateGrants(clerkUserId: string, relationshipId: number, input: unknown) {
  const parsed = updateGrantsSchema.safeParse(input)
  if (!parsed.success) {
    throw new AffiliateError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const user = await resolveUser(clerkUserId)
  const rel = await prisma.affiliateRelationship.findUnique({ where: { id: relationshipId } })
  if (!rel) throw new AffiliateError("NOT_FOUND", "Relationship not found")
  if (rel.shop_user_id !== user.id) throw new AffiliateError("FORBIDDEN", "Not your relationship")
  if (rel.status !== "APPROVED") throw new AffiliateError("NOT_APPROVED", "Relationship is not approved")

  const products = await prisma.product.findMany({
    where: { id: { in: parsed.data.product_ids }, user_id: user.id, affiliate_open: true },
    select: { id: true },
  })
  const validIds = products.map((p) => p.id)

  await prisma.$transaction(async (tx) => {
    // Revoke grants not in the new list
    await tx.affiliateProductGrant.updateMany({
      where: {
        relationship_id: relationshipId,
        product_id: { notIn: validIds },
        revoked_at: null,
      },
      data: { revoked_at: new Date() },
    })
    // Add new grants
    await tx.affiliateProductGrant.createMany({
      data: validIds.map((product_id) => ({ relationship_id: relationshipId, product_id })),
      skipDuplicates: true,
    })
  })
}

export async function suspendAffiliate(clerkUserId: string, relationshipId: number) {
  const user = await resolveUser(clerkUserId)
  const rel = await prisma.affiliateRelationship.findUnique({ where: { id: relationshipId } })
  if (!rel) throw new AffiliateError("NOT_FOUND", "Relationship not found")
  if (rel.shop_user_id !== user.id) throw new AffiliateError("FORBIDDEN", "Not your relationship")
  if (rel.status !== "APPROVED") throw new AffiliateError("NOT_APPROVED", "Relationship is not approved")

  await prisma.affiliateRelationship.update({
    where: { id: relationshipId },
    data: { status: "SUSPENDED" },
  })
}

export async function updateProductAffiliate(clerkUserId: string, productId: number, input: unknown) {
  const parsed = productAffiliateSchema.safeParse(input)
  if (!parsed.success) {
    throw new AffiliateError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const user = await resolveUser(clerkUserId)
  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) throw new AffiliateError("NOT_FOUND", "Product not found")
  if (product.user_id !== user.id) throw new AffiliateError("FORBIDDEN", "Not your product")

  await prisma.product.update({
    where: { id: productId },
    data: { affiliate_rate: parsed.data.affiliate_rate, affiliate_open: parsed.data.affiliate_open },
  })
}

// ── Affiliate (promoter) side ─────────────────────────────────────────────────

export async function applyAsAffiliate(clerkUserId: string, merchantHandle: string) {
  const user = await resolveUser(clerkUserId)
  if (!PRO_TIERS.includes(user.tier)) {
    throw new AffiliateError("WRONG_TIER", "Pro tier or higher required to become an affiliate")
  }

  const merchant = await prisma.user.findUnique({
    where: { username: merchantHandle },
    select: { id: true, tier: true },
  })
  if (!merchant) throw new AffiliateError("NOT_FOUND", "Merchant not found")
  if (!BUSINESS_TIERS.includes(merchant.tier)) {
    throw new AffiliateError("WRONG_TIER", "Target is not a Business creator")
  }
  if (merchant.id === user.id) throw new AffiliateError("SELF_REFERRAL", "Cannot affiliate with yourself")

  const existing = await prisma.affiliateRelationship.findUnique({
    where: { shop_user_id_affiliate_user_id: { shop_user_id: merchant.id, affiliate_user_id: user.id } },
  })
  if (existing) throw new AffiliateError("ALREADY_EXISTS", "You already have a relationship with this merchant")

  await prisma.affiliateRelationship.create({
    data: {
      shop_user_id: merchant.id,
      affiliate_user_id: user.id,
      initiated_by: "CREATOR_REQUEST",
    },
  })
}

export async function listMyShops(clerkUserId: string) {
  const user = await resolveUser(clerkUserId)
  return prisma.affiliateRelationship.findMany({
    where: { affiliate_user_id: user.id, status: "APPROVED" },
    orderBy: { reviewed_at: "desc" },
    select: {
      id: true,
      shop_user: {
        select: { username: true, profile: { select: { display_name: true, avatar_url: true } } },
      },
      product_grants: {
        where: { revoked_at: null },
        select: {
          product: {
            select: { id: true, name: true, price: true, cover_image_url: true, affiliate_rate: true },
          },
        },
      },
    },
  })
}

export async function getEarnings(clerkUserId: string) {
  const user = await resolveUser(clerkUserId)

  const pending = await prisma.order.aggregate({
    where: {
      affiliate_user_id: user.id,
      escrow_status: "RELEASED",
      affiliate_paid_at: null,
    },
    _sum: { affiliate_amount: true },
    _count: { id: true },
  })

  const paid = await prisma.order.aggregate({
    where: { affiliate_user_id: user.id, affiliate_paid_at: { not: null } },
    _sum: { affiliate_amount: true },
    _count: { id: true },
  })

  return {
    pending_amount: pending._sum.affiliate_amount ?? BigInt(0),
    pending_count: pending._count.id,
    paid_amount: paid._sum.affiliate_amount ?? BigInt(0),
    paid_count: paid._count.id,
  }
}

export async function listPayouts(clerkUserId: string) {
  const user = await resolveUser(clerkUserId)
  return prisma.affiliatePayoutRecord.findMany({
    where: { affiliate_user_id: user.id },
    orderBy: { created_at: "desc" },
    select: {
      id: true, period_start: true, period_end: true, total_amount: true,
      order_count: true, status: true, paid_at: true, failure_reason: true,
    },
  })
}

// ── Attribution validation ─────────────────────────────────────────────────────

export async function validateAffiliateRef(
  productId: number,
  affiliateHandle: string,
): Promise<number | null> {
  const affiliate = await prisma.user.findUnique({
    where: { username: affiliateHandle },
    select: { id: true },
  })
  if (!affiliate) return null

  const grant = await prisma.affiliateProductGrant.findFirst({
    where: {
      product_id: productId,
      revoked_at: null,
      relationship: {
        affiliate_user_id: affiliate.id,
        status: "APPROVED",
      },
    },
  })

  return grant ? affiliate.id : null
}

// ── Weekly payout cron ────────────────────────────────────────────────────────

export async function runWeeklyPayouts() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7-day dispute buffer

  const orders = await prisma.order.findMany({
    where: {
      affiliate_user_id: { not: null },
      escrow_status: "RELEASED",
      affiliate_paid_at: null,
      released_at: { lte: cutoff },
    },
    select: { id: true, affiliate_user_id: true, affiliate_amount: true },
  })

  // Group by affiliate
  const byAffiliate = new Map<number, { total: bigint; orderIds: number[] }>()
  for (const o of orders) {
    if (!o.affiliate_user_id || !o.affiliate_amount) continue
    const existing = byAffiliate.get(o.affiliate_user_id)
    if (existing) {
      existing.total += o.affiliate_amount
      existing.orderIds.push(o.id)
    } else {
      byAffiliate.set(o.affiliate_user_id, { total: o.affiliate_amount, orderIds: [o.id] })
    }
  }

  const periodEnd = new Date()
  const periodStart = cutoff
  const results = { paid: 0, skipped: 0, failed: 0 }

  for (const [affiliateUserId, { total, orderIds }] of byAffiliate) {
    if (Number(total) < MIN_PAYOUT_UGX) {
      results.skipped++
      continue
    }

    try {
      const record = await prisma.affiliatePayoutRecord.create({
        data: {
          affiliate_user_id: affiliateUserId,
          period_start: periodStart,
          period_end: periodEnd,
          total_amount: total,
          order_count: orderIds.length,
          status: "PROCESSING",
        },
      })

      // Mark orders as paid
      await prisma.order.updateMany({
        where: { id: { in: orderIds } },
        data: { affiliate_paid_at: new Date() },
      })

      // TODO: initiate Pesapal disbursement to affiliate's momo_number
      // On success: update record status to PAID, set paid_at, set pesapal_txn_id
      // On failure: update record status to FAILED, set failure_reason

      await prisma.affiliatePayoutRecord.update({
        where: { id: record.id },
        data: { status: "PAID", paid_at: new Date() },
      })

      results.paid++
    } catch (err) {
      console.error("Affiliate payout failed for user", affiliateUserId, err)
      results.failed++
    }
  }

  return results
}
