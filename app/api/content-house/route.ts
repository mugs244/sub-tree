import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

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

  // Validate share rates sum to 100
  const total = members.reduce((sum, m) => sum + m.share_rate, 0)
  if (Math.round(total) !== 100) {
    return NextResponse.json(
      { error: "Share rates must sum to 100%" },
      { status: 422 },
    )
  }

  const request = await prisma.contentHouseRequest.create({
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
    select: { id: true },
  })

  return NextResponse.json({ id: request.id }, { status: 201 })
}
