import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const donations = await prisma.donation.findMany({
    where: { user: { clerk_user_id: userId } },
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
