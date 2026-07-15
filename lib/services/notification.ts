import { prisma } from "@/lib/db"
import type { NotificationType, Prisma } from "@prisma/client"

interface CreateNotificationInput {
  userId: number
  type: NotificationType
  title: string
  body: string
  metadata?: Prisma.InputJsonValue
}

// In-app notification only — never throws into the caller's flow (a
// notification failing to write must not break a donation/withdrawal).
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        user_id: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        metadata: input.metadata,
      },
    })
  } catch (err) {
    console.error("Notification create failed", { input, err })
  }
}

export async function listNotifications(userId: number, limit = 30) {
  return prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: limit,
  })
}

export async function markNotificationRead(userId: number, notificationId: number): Promise<void> {
  await prisma.notification.updateMany({
    where: { id: notificationId, user_id: userId },
    data: { read_at: new Date() },
  })
}

export async function getUnreadNotificationCount(userId: number): Promise<number> {
  return prisma.notification.count({ where: { user_id: userId, read_at: null } })
}

interface BroadcastAnnouncementInput {
  title: string
  body: string
  /** Omit to send to every user; set to notify just one. */
  targetUserId?: number
}

// Returns the number of users the announcement was recorded for.
export async function broadcastAnnouncement(input: BroadcastAnnouncementInput): Promise<number> {
  if (input.targetUserId) {
    await prisma.notification.create({
      data: {
        user_id: input.targetUserId,
        type: "ANNOUNCEMENT",
        title: input.title,
        body: input.body,
      },
    })
    return 1
  }

  const users = await prisma.user.findMany({ select: { id: true } })
  if (users.length === 0) return 0

  const result = await prisma.notification.createMany({
    data: users.map((u) => ({
      user_id: u.id,
      type: "ANNOUNCEMENT" as const,
      title: input.title,
      body: input.body,
    })),
  })
  return result.count
}
