import { NextResponse } from "next/server"
import { getPublicTiers } from "@/lib/services/membership-tiers"

export async function GET(_req: Request, { params }: { params: { handle?: string } }) {
  const handle = params.handle?.toString() ?? ""
  if (!handle) return NextResponse.json({ error: "Missing handle" }, { status: 400 })

  const tiers = await getPublicTiers(handle)
  return NextResponse.json({ data: tiers?.map((tier) => ({ ...tier, price_ugx: Number(tier.price_ugx) })) ?? [] })
}
