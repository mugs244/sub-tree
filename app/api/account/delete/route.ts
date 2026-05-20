import { NextResponse } from "next/server"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

export async function POST(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: "NOT_FOUND", message: "User not found" }, { status: 404 })

  // Soft-delete: mark deleted_at, clear username so it's reclaimable
  await prisma.user.update({
    where: { id: user.id },
    data: { deleted_at: new Date(), username: null },
  })

  // Delete from Clerk so they can't sign back in
  const client = await clerkClient()
  await client.users.deleteUser(userId)

  return NextResponse.json({ data: null })
}
