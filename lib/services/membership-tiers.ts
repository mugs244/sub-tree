import { prisma } from "@/lib/db"
import { Prisma } from "@prisma/client"
import { z } from "zod"

export class TierError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "FORBIDDEN" | "VALIDATION_ERROR" | "LIMIT_REACHED",
    message: string,
  ) {
    super(message)
    this.name = "TierError"
  }
}

const MAX_TIERS = 5

export const createTierSchema = z.object({
  name:        z.string().min(1).max(50).trim(),
  description: z.string().max(500).trim().optional(),
  price_ugx:   z.number().int().positive(),
  perks:       z.array(z.string().min(1).max(200).trim()).max(10).optional(),
})

export const updateTierSchema = z.object({
  name:        z.string().min(1).max(50).trim().optional(),
  description: z.string().max(500).trim().nullable().optional(),
  price_ugx:   z.number().int().positive().optional(),
  perks:       z.array(z.string().min(1).max(200).trim()).max(10).nullable().optional(),
  is_active:   z.boolean().optional(),
  position:    z.number().int().min(0).optional(),
}).refine((d) => Object.keys(d).length > 0, "At least one field required")

// ── Queries ───────────────────────────────────────────────────────────────────

export async function listCreatorTiers(userId: number) {
  return prisma.membershipTier.findMany({
    where: { creator_id: userId },
    orderBy: { position: "asc" },
  })
}

export async function getPublicTiers(creatorHandle: string) {
  const creator = await prisma.user.findUnique({
    where: { username: creatorHandle },
    select: { id: true },
  })
  if (!creator) return null
  return prisma.membershipTier.findMany({
    where: { creator_id: creator.id, is_active: true },
    orderBy: { position: "asc" },
    select: { id: true, name: true, description: true, price_ugx: true, perks: true, position: true },
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createTier(userId: number, input: unknown) {
  const parsed = createTierSchema.safeParse(input)
  if (!parsed.success) {
    throw new TierError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const count = await prisma.membershipTier.count({ where: { creator_id: userId } })
  if (count >= MAX_TIERS) {
    throw new TierError("LIMIT_REACHED", `Maximum ${MAX_TIERS} tiers allowed`)
  }

  const { name, description, price_ugx, perks } = parsed.data

  const maxPos = await prisma.membershipTier.aggregate({
    where: { creator_id: userId },
    _max: { position: true },
  })
  const position = (maxPos._max.position ?? -1) + 1

  return prisma.membershipTier.create({
    data: {
      creator_id:  userId,
      name,
      description: description ?? null,
      price_ugx:   BigInt(price_ugx),
      perks:       perks ?? Prisma.JsonNull,
      position,
    },
  })
}

export async function updateTier(userId: number, tierId: number, input: unknown) {
  const parsed = updateTierSchema.safeParse(input)
  if (!parsed.success) {
    throw new TierError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const tier = await prisma.membershipTier.findUnique({ where: { id: tierId } })
  if (!tier) throw new TierError("NOT_FOUND", "Tier not found")
  if (tier.creator_id !== userId) throw new TierError("FORBIDDEN", "Not your tier")

  const { price_ugx, perks, ...rest } = parsed.data
  await prisma.membershipTier.update({
    where: { id: tierId },
    data: {
      ...rest,
      ...(price_ugx !== undefined ? { price_ugx: BigInt(price_ugx) } : {}),
      ...(perks !== undefined ? { perks: perks ?? Prisma.JsonNull } : {}),
    },
  })
}

export async function deleteTier(userId: number, tierId: number) {
  const tier = await prisma.membershipTier.findUnique({ where: { id: tierId } })
  if (!tier) throw new TierError("NOT_FOUND", "Tier not found")
  if (tier.creator_id !== userId) throw new TierError("FORBIDDEN", "Not your tier")
  await prisma.membershipTier.delete({ where: { id: tierId } })
}
