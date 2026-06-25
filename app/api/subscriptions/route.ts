import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

type RequestBody = {
  creatorHandle?: string
  tierId?: number
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const creatorHandle = body.creatorHandle?.toString().trim() ?? ""
  const tierId = Number(body.tierId)
  if (!creatorHandle || Number.isNaN(tierId)) {
    return NextResponse.json({ error: "creatorHandle and tierId are required" }, { status: 400 })
  }

  const tier = await prisma.membershipTier.findFirst({
    where: {
      id: tierId,
      is_active: true,
      creator: {
        username: creatorHandle,
        deleted_at: null,
      },
    },
    select: {
      id: true,
      name: true,
      price_ugx: true,
      creator: { select: { username: true } },
    },
  })

  if (!tier) {
    return NextResponse.json({ error: "Tier not found" }, { status: 404 })
  }

  return NextResponse.json(
    {
      error: "Creator membership checkout is not implemented yet. Recurring billing integration is pending.",
      tier: {
        id: tier.id,
        name: tier.name,
        price_ugx: Number(tier.price_ugx),
        creatorHandle: tier.creator.username,
      },
    },
    { status: 501 },
  )
}
