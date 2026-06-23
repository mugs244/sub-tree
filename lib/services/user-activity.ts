import { prisma } from "@/lib/db"

export async function touchUserLastActive(clerkUserId: string) {
  await prisma.user.updateMany({
    where: { clerk_user_id: clerkUserId },
    data: { last_active_at: new Date() },
  })
}
