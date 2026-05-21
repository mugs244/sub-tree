import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  const events = await prisma.donationEvent.findMany({
    where: {
      event_type: "PAYMENT_COMPLETED",
      donation: { user_id: user.id },
    },
    orderBy: { created_at: "desc" },
    take: 30,
    select: {
      id: true,
      read_at: true,
      created_at: true,
      donation: {
        select: {
          donor_name: true,
          amount: true,
          currency: true,
          note: true,
          referrer_source: true,
        },
      },
    },
  })

  return NextResponse.json({ data: events })
}
