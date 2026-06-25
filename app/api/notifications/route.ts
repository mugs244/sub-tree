import { getSession } from "@/lib/auth/session"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  const userId = session.userId

  const events = await prisma.donationEvent.findMany({
    where: {
      event_type: "PAYMENT_COMPLETED",
      donation: { user_id: userId },
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
