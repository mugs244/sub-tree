import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { initiateSubscription, TIER_PRICES } from "@/lib/services/subscription"
import type { Tier } from "@prisma/client"

const PAID_TIERS = Object.keys(TIER_PRICES) as Exclude<Tier, "FREE">[]

export async function POST(req: Request): Promise<NextResponse> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  let body: { tier?: string; phone?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { tier, phone } = body
  if (!tier || !PAID_TIERS.includes(tier as Exclude<Tier, "FREE">)) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
  }
  if (!phone || !/^0[0-9]{9}$/.test(phone.replace(/\s/g, ""))) {
    return NextResponse.json({ error: "Valid Ugandan phone number required" }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: clerkId },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { subscriptionId, status } = await initiateSubscription(
    user.id,
    tier as Exclude<Tier, "FREE">,
    phone.replace(/\s/g, ""),
  )

  return NextResponse.json({ subscriptionId, status }, { status: 202 })
}
