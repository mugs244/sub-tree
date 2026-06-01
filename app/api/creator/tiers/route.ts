import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createTier, listCreatorTiers, TierError } from "@/lib/services/membership-tiers"

function serializeTier(tier: Awaited<ReturnType<typeof createTier>>) {
  return {
    ...tier,
    price_ugx: Number(tier.price_ugx),
  }
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const tiers = await listCreatorTiers(userId)
  return NextResponse.json({ data: tiers.map(serializeTier) })
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  try {
    const tier = await createTier(userId, body)
    return NextResponse.json({ data: serializeTier(tier) }, { status: 201 })
  } catch (error) {
    if (error instanceof TierError) {
      const status =
        error.code === "VALIDATION_ERROR"
          ? 400
          : error.code === "FORBIDDEN"
          ? 403
          : error.code === "NOT_FOUND"
          ? 404
          : error.code === "LIMIT_REACHED"
          ? 409
          : 400
      return NextResponse.json({ error: error.message }, { status })
    }
    console.error(error)
    return NextResponse.json({ error: "Unable to create tier" }, { status: 500 })
  }
}
