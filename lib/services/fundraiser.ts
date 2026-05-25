import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { z } from "zod"

export class FundraiserError extends Error {
  constructor(
    public readonly code:
      | "USER_NOT_FOUND"
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "VALIDATION_ERROR"
      | "ALREADY_ACTIVE"
      | "TERMINAL_STATUS"
      | "INVALID_SPLIT",
    message: string,
  ) {
    super(message)
    this.name = "FundraiserError"
  }
}

const PRO_TIERS = ["PRO", "BUSINESS", "CONTENT_HOUSE"]

// ── Validators ────────────────────────────────────────────────────────────────

export const createFundraiserSchema = z.object({
  title:           z.string().min(3, "Title must be at least 3 characters").max(120, "Title too long").trim(),
  description:     z.string().min(10, "Description must be at least 10 characters").max(2000, "Description too long").trim(),
  goal_amount:     z.number().int().positive("Goal must be a positive amount"),
  deadline:        z.string().datetime().optional(),
  cover_image_url: z.url("Must be a valid URL").optional(),
  show_progress:   z.boolean().optional(),
  fundraiser_type: z.enum(["PERSONAL", "CHARITY"]).optional(),
})

export const updateFundraiserSchema = z.object({
  title:           z.string().min(3).max(120).trim().optional(),
  description:     z.string().min(10).max(2000).trim().optional(),
  goal_amount:     z.number().int().positive().optional(),
  deadline:        z.string().datetime().nullable().optional(),
  cover_image_url: z.url().nullable().optional(),
  show_progress:   z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, "At least one field required")

export const charityRequestSchema = z.object({
  charity_username: z.string().min(1, "Charity username is required"),
})

export const charityReviewSchema = z.object({
  action:                   z.enum(["APPROVED", "REJECTED", "SUSPENDED"]),
  rejection_reason:         z.string().max(500).optional(),
  charity_split_charity_pct: z.number().int().min(1).max(99).optional(),
})

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolveUser(clerkUserId: string) {
  const user = await prisma.user.findUnique({
    where: { clerk_user_id: clerkUserId },
    select: { id: true, tier: true },
  })
  if (!user) throw new FundraiserError("USER_NOT_FOUND", "User record not found")
  return user
}

async function resolveFundraiser(id: number, userId: number) {
  const f = await prisma.fundraiser.findUnique({ where: { id } })
  if (!f) throw new FundraiserError("NOT_FOUND", "Fundraiser not found")
  if (f.user_id !== userId) throw new FundraiserError("FORBIDDEN", "Not your fundraiser")
  return f
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function listIncomingCampaignRequests(clerkUserId: string) {
  const user = await resolveUser(clerkUserId)
  return prisma.fundraiser.findMany({
    where: { charity_user_id: user.id, charity_approval_status: "PENDING" },
    orderBy: { created_at: "desc" },
    select: {
      id: true, title: true, description: true, goal_amount: true,
      deadline: true, created_at: true,
      user: {
        select: {
          username: true,
          profile: { select: { display_name: true, avatar_url: true } },
        },
      },
    },
  })
}

export async function listFundraisers(clerkUserId: string) {
  const user = await resolveUser(clerkUserId)
  return prisma.fundraiser.findMany({
    where: { user_id: user.id },
    orderBy: { created_at: "desc" },
    select: {
      id: true, title: true, description: true, goal_amount: true,
      raised_amount: true, deadline: true, cover_image_url: true,
      show_progress: true, status: true, fundraiser_type: true,
      charity_user_id: true, charity_approval_status: true,
      charity_split_creator_pct: true, charity_split_charity_pct: true,
      created_at: true, updated_at: true,
      _count: { select: { donations: true } },
    },
  })
}

export async function getFundraiser(id: number) {
  return prisma.fundraiser.findUnique({
    where: { id },
    select: {
      id: true, title: true, description: true, goal_amount: true,
      raised_amount: true, deadline: true, cover_image_url: true,
      show_progress: true, status: true, fundraiser_type: true,
      charity_approval_status: true, charity_split_creator_pct: true,
      charity_split_charity_pct: true,
      user: { select: { username: true, profile: { select: { display_name: true, avatar_url: true } } } },
      charity_user: { select: { username: true, profile: { select: { display_name: true } } } },
    },
  })
}

export async function getActiveFundraiser(userId: number) {
  return prisma.fundraiser.findFirst({
    where: { user_id: userId, status: "ACTIVE" },
    select: {
      id: true, title: true, description: true, goal_amount: true,
      raised_amount: true, deadline: true, cover_image_url: true,
      show_progress: true, fundraiser_type: true,
      charity_approval_status: true,
    },
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createFundraiser(clerkUserId: string, input: unknown) {
  const parsed = createFundraiserSchema.safeParse(input)
  if (!parsed.success) {
    throw new FundraiserError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const user = await resolveUser(clerkUserId)
  if (!PRO_TIERS.includes(user.tier)) {
    throw new FundraiserError("FORBIDDEN", "Pro tier required to create fundraisers")
  }

  const { deadline, goal_amount, ...rest } = parsed.data
  return prisma.fundraiser.create({
    data: {
      user_id: user.id,
      goal_amount: BigInt(goal_amount),
      deadline: deadline ? new Date(deadline) : undefined,
      ...rest,
    },
    select: { id: true },
  })
}

export async function updateFundraiser(clerkUserId: string, id: number, input: unknown) {
  const parsed = updateFundraiserSchema.safeParse(input)
  if (!parsed.success) {
    throw new FundraiserError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const user = await resolveUser(clerkUserId)
  await resolveFundraiser(id, user.id)

  const { deadline, goal_amount, ...rest } = parsed.data
  await prisma.fundraiser.update({
    where: { id },
    data: {
      ...rest,
      ...(goal_amount !== undefined ? { goal_amount: BigInt(goal_amount) } : {}),
      ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
    },
  })
}

export async function activateFundraiser(clerkUserId: string, id: number) {
  const user = await resolveUser(clerkUserId)
  const f = await resolveFundraiser(id, user.id)

  if (["CLOSED", "COMPLETED", "EXPIRED"].includes(f.status)) {
    throw new FundraiserError("TERMINAL_STATUS", "Cannot activate a fundraiser in a terminal status")
  }

  // For charity fundraisers, require approval before activation
  if (f.fundraiser_type === "CHARITY" && f.charity_approval_status !== "APPROVED") {
    throw new FundraiserError("FORBIDDEN", "Charity fundraiser must be approved before activation")
  }

  await prisma.$transaction([
    // Deactivate any currently active fundraiser
    prisma.fundraiser.updateMany({
      where: { user_id: user.id, status: "ACTIVE" },
      data: { status: "CLOSED" },
    }),
    // Activate the target
    prisma.fundraiser.update({ where: { id }, data: { status: "ACTIVE" } }),
  ])
}

export async function closeFundraiser(clerkUserId: string, id: number) {
  const user = await resolveUser(clerkUserId)
  const f = await resolveFundraiser(id, user.id)

  if (f.status === "CLOSED" || f.status === "COMPLETED" || f.status === "EXPIRED") {
    throw new FundraiserError("TERMINAL_STATUS", "Fundraiser is already in a terminal status")
  }

  await prisma.fundraiser.update({ where: { id }, data: { status: "CLOSED" } })
}

export async function sendCharityRequest(clerkUserId: string, fundraiserId: number, input: unknown) {
  const parsed = charityRequestSchema.safeParse(input)
  if (!parsed.success) {
    throw new FundraiserError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const user = await resolveUser(clerkUserId)
  const f = await resolveFundraiser(fundraiserId, user.id)

  if (f.fundraiser_type !== "CHARITY") {
    throw new FundraiserError("VALIDATION_ERROR", "Only CHARITY fundraisers can send campaign requests")
  }

  const charity = await prisma.user.findUnique({
    where: { username: parsed.data.charity_username },
    select: { id: true, tier: true },
  })
  if (!charity) throw new FundraiserError("NOT_FOUND", "Charity account not found")
  if (!["BUSINESS", "CONTENT_HOUSE"].includes(charity.tier)) {
    throw new FundraiserError("FORBIDDEN", "Target account must be a Business tier account")
  }

  await prisma.fundraiser.update({
    where: { id: fundraiserId },
    data: {
      charity_user_id: charity.id,
      charity_approval_status: "PENDING",
    },
  })
}

export async function reviewCharityRequest(clerkUserId: string, fundraiserId: number, input: unknown) {
  const parsed = charityReviewSchema.safeParse(input)
  if (!parsed.success) {
    throw new FundraiserError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const user = await resolveUser(clerkUserId)

  const f = await prisma.fundraiser.findUnique({ where: { id: fundraiserId } })
  if (!f) throw new FundraiserError("NOT_FOUND", "Fundraiser not found")
  if (f.charity_user_id !== user.id) throw new FundraiserError("FORBIDDEN", "Not your campaign request")
  if (f.charity_approval_status !== "PENDING") {
    throw new FundraiserError("VALIDATION_ERROR", "Request is no longer pending")
  }

  const { action, rejection_reason, charity_split_charity_pct } = parsed.data
  const creator_pct = charity_split_charity_pct !== undefined ? 100 - charity_split_charity_pct : null
  const charity_pct = charity_split_charity_pct ?? null

  if (action === "APPROVED" && (creator_pct === null || charity_pct === null)) {
    throw new FundraiserError("INVALID_SPLIT", "Split percentages required for approval")
  }

  await prisma.fundraiser.update({
    where: { id: fundraiserId },
    data: {
      charity_approval_status: action,
      charity_approved_at:     action === "APPROVED" ? new Date() : undefined,
      charity_rejected_at:     action === "REJECTED" ? new Date() : undefined,
      charity_rejection_reason: rejection_reason ?? null,
      charity_split_creator_pct: creator_pct,
      charity_split_charity_pct: charity_pct,
    },
  })
}

export async function listSupporters(clerkUserId: string, fundraiserId: number, page = 1) {
  const user = await resolveUser(clerkUserId)
  await resolveFundraiser(fundraiserId, user.id)

  const take = 50
  return prisma.donation.findMany({
    where: { fundraiser_id: fundraiserId, status: "COMPLETED" },
    orderBy: { created_at: "desc" },
    skip: (page - 1) * take,
    take,
    select: { donor_name: true, donor_phone: true, amount: true, currency: true, created_at: true },
  })
}

// Called only by webhook handler — increments raised_amount
export async function incrementRaisedAmount(fundraiserId: number, amount: number, tx: Prisma.TransactionClient) {
  await tx.fundraiser.update({
    where: { id: fundraiserId },
    data: {
      raised_amount: { increment: BigInt(amount) },
    },
  })

  // Mark COMPLETED if goal reached
  const f = await tx.fundraiser.findUnique({
    where: { id: fundraiserId },
    select: { raised_amount: true, goal_amount: true, status: true },
  })
  if (f && f.status === "ACTIVE" && Number(f.raised_amount) >= Number(f.goal_amount)) {
    await tx.fundraiser.update({ where: { id: fundraiserId }, data: { status: "COMPLETED" } })
  }
}
