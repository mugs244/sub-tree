import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

const BYPASS_KEY = process.env.BYPASS_PAYMENTS_KEY
const VALID_TIERS = ["PRO", "BUSINESS", "CONTENT_HOUSE"] as const

// Dev-only shortcut — no key required in request (key presence gates the route)
export async function POST(req: Request): Promise<NextResponse> {
  if (!BYPASS_KEY) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
  }

  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const { tier } = (await req.json()) as { tier?: string }
  if (!tier || !VALID_TIERS.includes(tier as (typeof VALID_TIERS)[number])) {
    return NextResponse.json({ error: "INVALID_TIER" }, { status: 400 })
  }

  await prisma.user.update({
    where: { clerk_user_id: userId },
    data: { tier: tier as (typeof VALID_TIERS)[number] },
  })

  return NextResponse.json({ ok: true })
}
