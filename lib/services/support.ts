import { prisma } from "@/lib/db"
import { getAllAdminIds } from "@/lib/services/admin"
import { createNotification } from "@/lib/services/notification"

// One flat conversation per creator with Sub-tree support — not a general
// multi-party chat. Polling-based, same lightweight pattern already used by
// the donation/withdrawal notification feed (no websockets in this codebase).

export async function listSupportMessages(userId: number, limit = 100) {
  return prisma.supportMessage.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "asc" },
    take: limit,
    select: {
      id: true, body: true, is_from_admin: true, read_at: true, created_at: true,
      sender: { select: { username: true, email: true } },
    },
  })
}

export async function sendCreatorSupportMessage(userId: number, body: string): Promise<void> {
  const trimmed = body.trim()
  if (!trimmed) throw new Error("Message cannot be empty")

  await prisma.supportMessage.create({
    data: { user_id: userId, sender_id: userId, is_from_admin: false, body: trimmed },
  })

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { username: true, email: true } })
  const name = user?.username ?? user?.email ?? `user #${userId}`

  await Promise.all(
    getAllAdminIds().map((adminId) =>
      createNotification({
        userId: adminId,
        type: "SUPPORT_MESSAGE",
        title: `New support message from ${name}`,
        body: trimmed.length > 140 ? `${trimmed.slice(0, 140)}…` : trimmed,
        metadata: { fromUserId: userId },
      }),
    ),
  )
}

// Marks every unread message in the creator's thread as read, from the
// perspective of the caller: a creator reading marks admin-authored messages
// read; an admin reading marks creator-authored messages read.
export async function markSupportThreadRead(userId: number, readerIsAdmin: boolean): Promise<void> {
  await prisma.supportMessage.updateMany({
    where: { user_id: userId, is_from_admin: !readerIsAdmin, read_at: null },
    data: { read_at: new Date() },
  })
}

// Admin-facing: every creator with a support thread, most recently active
// first, with the last message preview and unread count.
export async function listSupportThreads(limit = 50) {
  const latest = await prisma.supportMessage.groupBy({
    by: ["user_id"],
    _max: { created_at: true },
    orderBy: { _max: { created_at: "desc" } },
    take: limit,
  })

  const threads = await Promise.all(
    latest.map(async (row) => {
      const [user, lastMessage, unreadCount] = await Promise.all([
        prisma.user.findUnique({ where: { id: row.user_id }, select: { username: true, email: true } }),
        prisma.supportMessage.findFirst({
          where: { user_id: row.user_id },
          orderBy: { created_at: "desc" },
          select: { body: true, is_from_admin: true, created_at: true },
        }),
        prisma.supportMessage.count({
          where: { user_id: row.user_id, is_from_admin: false, read_at: null },
        }),
      ])
      return { userId: row.user_id, user, lastMessage, unreadCount }
    }),
  )

  return threads
}

export async function sendAdminSupportMessage(adminId: number, targetUserId: number, body: string): Promise<void> {
  const trimmed = body.trim()
  if (!trimmed) throw new Error("Message cannot be empty")

  await prisma.supportMessage.create({
    data: { user_id: targetUserId, sender_id: adminId, is_from_admin: true, body: trimmed },
  })

  await createNotification({
    userId: targetUserId,
    type: "SUPPORT_MESSAGE",
    title: "New message from Sub-tree support",
    body: trimmed.length > 140 ? `${trimmed.slice(0, 140)}…` : trimmed,
    metadata: { fromAdminId: adminId },
  })
}
