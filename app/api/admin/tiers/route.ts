import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const tiers = await prisma.membershipTier.findMany({
    orderBy: { created_at: "desc" },
    include: {
      creator: { select: { id: true, username: true, email: true } },
    },
  })

  return NextResponse.json(
    tiers.map((tier) => ({
      id: tier.id,
      creator: {
        id: tier.creator.id,
        username: tier.creator.username,
        email: tier.creator.email,
      },
      name: tier.name,
      price_ugx: Number(tier.price_ugx),
      perks: tier.perks,
      created_at: tier.created_at.toISOString(),
      updated_at: tier.updated_at.toISOString(),
    })),
  )
}
