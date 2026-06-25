import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  const donations = await prisma.donation.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      donor_name: true,
      donor_phone: true,
      amount: true,
      currency: true,
      status: true,
      provider: true,
      created_at: true,
    },
  })

  return NextResponse.json({ data: donations })
}
