import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const { id } = await params
  const eventId = parseInt(id, 10)
  if (isNaN(eventId)) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 })

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  const event = await prisma.donationEvent.findFirst({
    where: { id: eventId, donation: { user_id: user.id } },
    select: { id: true, read_at: true },
  })
  if (!event) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })
  if (event.read_at) return NextResponse.json({ data: { ok: true } })

  await prisma.donationEvent.update({
    where: { id: eventId },
    data: { read_at: new Date() },
  })

  return NextResponse.json({ data: { ok: true } })
}
