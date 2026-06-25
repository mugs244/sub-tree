import { prisma } from "@/lib/db"

export async function touchUserLastActive(userId: number) {
  await prisma.user.update({
    where: { id: userId },
    data: { last_active_at: new Date() },
  })
}
