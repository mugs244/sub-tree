import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

// Polled by /onboarding/payment to check if STK push was approved
export async function GET(): Promise<NextResponse> {
  const { userId: clerkId } = await auth()
  if (!clerkId) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: clerkId },
    select: {
      tier: true,
      subscription: { select: { status: true, tier: true, trial_ends_at: true } },
    },
  })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  return NextResponse.json({
    tier: user.tier,
    subscription: user.subscription ?? null,
  })
}
