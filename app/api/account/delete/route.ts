import { NextResponse } from "next/server"
import { getSession, destroySession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export async function POST(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })
  const userId = session.userId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: "NOT_FOUND", message: "User not found" }, { status: 404 })

  // Soft-delete: mark deleted_at, clear username so it's reclaimable
  await prisma.user.update({
    where: { id: user.id },
    data: { deleted_at: new Date(), username: null },
  })

  // Destroy the session so the user is signed out
  await destroySession()

  return NextResponse.json({ data: null })
}
