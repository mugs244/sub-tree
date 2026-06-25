import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { randomUUID } from "crypto"

const TRIAL_DAYS = 5
const VALID_TIERS = ["PRO", "BUSINESS"] as const
type TrialTier = (typeof VALID_TIERS)[number]

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  const { tier } = (await req.json()) as { tier?: string }
  if (!tier || !VALID_TIERS.includes(tier as TrialTier)) {
    return NextResponse.json({ error: "INVALID_TIER" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tier: true, subscription: { select: { id: true } } },
  })
  if (!user) return new NextResponse("User not found", { status: 404 })
  if (user.tier !== "FREE") {
    return NextResponse.json({ error: "ALREADY_ACTIVE" }, { status: 409 })
  }

  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS)

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { tier: tier as TrialTier },
    }),
    prisma.subscription.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        tier: tier as TrialTier,
        status: "TRIALING",
        trial_ends_at: trialEnd,
        current_period_end: trialEnd,
        idempotency_key: randomUUID(),
      },
      update: {
        tier: tier as TrialTier,
        status: "TRIALING",
        trial_ends_at: trialEnd,
        current_period_end: trialEnd,
      },
    }),
  ])

  return NextResponse.json({ ok: true })
}
