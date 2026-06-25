import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { z } from "zod"
import { randomUUID } from "crypto"

const TRIAL_DAYS = 5

const MemberSchema = z.object({
  name: z.string().min(1),
  phone: z.string().regex(/^0[0-9]{9}$/, "Use format 07XXXXXXXX"),
  email: z.string().email(),
  share_rate: z.number().min(0).max(100),
})

const BodySchema = z.object({
  company_email: z.string().email(),
  social_platforms: z.array(z.string()).min(1),
  features_requested: z.array(z.string()).min(1),
  notes: z.string().optional(),
  members: z.array(MemberSchema).min(2).max(10),
})

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { company_email, social_platforms, features_requested, notes, members } = parsed.data

  const total = members.reduce((sum, m) => sum + m.share_rate, 0)
  if (Math.round(total) !== 100) {
    return NextResponse.json({ error: "Share rates must sum to 100%" }, { status: 422 })
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tier: true },
  })
  if (!user) return new NextResponse("User not found", { status: 404 })

  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS)

  await prisma.$transaction(async (tx) => {
    await tx.contentHouseRequest.create({
      data: {
        company_email,
        social_platforms,
        features_requested,
        notes: notes ?? null,
        members: {
          create: members.map((m) => ({
            name: m.name,
            phone: m.phone,
            email: m.email,
            share_rate: m.share_rate,
          })),
        },
      },
    })

    // Grant CONTENT_HOUSE tier immediately as trial while under review
    await tx.user.update({
      where: { id: user.id },
      data: { tier: "CONTENT_HOUSE" },
    })

    await tx.subscription.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        tier: "CONTENT_HOUSE",
        status: "TRIALING",
        trial_ends_at: trialEnd,
        current_period_end: trialEnd,
        idempotency_key: randomUUID(),
      },
      update: {
        tier: "CONTENT_HOUSE",
        status: "TRIALING",
        trial_ends_at: trialEnd,
        current_period_end: trialEnd,
      },
    })
  })

  return NextResponse.json({ ok: true }, { status: 201 })
}
