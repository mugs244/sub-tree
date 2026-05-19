import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { addLinkSchema, updateLinkSchema, reorderLinkSchema } from "@/lib/validators/link"

export class LinkError extends Error {
  constructor(
    public readonly code:
      | "USER_NOT_FOUND"
      | "LINK_NOT_FOUND"
      | "VALIDATION_ERROR"
      | "FORBIDDEN",
    message: string,
  ) {
    super(message)
    this.name = "LinkError"
  }
}

export async function listLinks(clerkUserId: string) {
  const user = await prisma.user.findUnique({
    where: { clerk_user_id: clerkUserId },
    select: { id: true },
  })
  if (!user) throw new LinkError("USER_NOT_FOUND", "User record not found")

  return prisma.link.findMany({
    where: { user_id: user.id },
    orderBy: { position: "asc" },
    select: {
      id: true,
      url: true,
      label: true,
      is_enabled: true,
      position: true,
      clicks: true,
      created_at: true,
    },
  })
}

export async function addLink(clerkUserId: string, input: unknown): Promise<void> {
  const parsed = addLinkSchema.safeParse(input)
  if (!parsed.success) {
    throw new LinkError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: clerkUserId },
    select: { id: true },
  })
  if (!user) throw new LinkError("USER_NOT_FOUND", "User record not found")

  const maxPosition = await prisma.link.aggregate({
    where: { user_id: user.id },
    _max: { position: true },
  })

  await prisma.link.create({
    data: {
      user_id: user.id,
      url: parsed.data.url,
      label: parsed.data.label,
      position: (maxPosition._max.position ?? -1) + 1,
    },
  })
}

export async function updateLink(
  clerkUserId: string,
  linkId: number,
  input: unknown,
): Promise<void> {
  const parsed = updateLinkSchema.safeParse(input)
  if (!parsed.success) {
    throw new LinkError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { user: { select: { clerk_user_id: true } } },
  })
  if (!link) throw new LinkError("LINK_NOT_FOUND", "Link not found")
  if (link.user.clerk_user_id !== clerkUserId) throw new LinkError("FORBIDDEN", "Not your link")

  await prisma.link.update({
    where: { id: linkId },
    data: parsed.data,
  })
}

export async function deleteLink(clerkUserId: string, linkId: number): Promise<void> {
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { user_id: true, position: true, user: { select: { clerk_user_id: true } } },
  })
  if (!link) throw new LinkError("LINK_NOT_FOUND", "Link not found")
  if (link.user.clerk_user_id !== clerkUserId) throw new LinkError("FORBIDDEN", "Not your link")

  await prisma.$transaction([
    prisma.link.delete({ where: { id: linkId } }),
    prisma.link.updateMany({
      where: { user_id: link.user_id, position: { gt: link.position } },
      data: { position: { decrement: 1 } },
    }),
  ])
}

export async function reorderLink(
  clerkUserId: string,
  linkId: number,
  input: unknown,
): Promise<void> {
  const parsed = reorderLinkSchema.safeParse(input)
  if (!parsed.success) {
    throw new LinkError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { user_id: true, position: true, user: { select: { clerk_user_id: true } } },
  })
  if (!link) throw new LinkError("LINK_NOT_FOUND", "Link not found")
  if (link.user.clerk_user_id !== clerkUserId) throw new LinkError("FORBIDDEN", "Not your link")

  const swapPosition = parsed.data.direction === "up" ? link.position - 1 : link.position + 1

  const neighbor = await prisma.link.findFirst({
    where: { user_id: link.user_id, position: swapPosition },
    select: { id: true },
  })
  if (!neighbor) return // already at boundary

  const tempPosition = -999
  await prisma.$transaction([
    prisma.link.update({ where: { id: linkId }, data: { position: tempPosition } }),
    prisma.link.update({ where: { id: neighbor.id }, data: { position: link.position } }),
    prisma.link.update({ where: { id: linkId }, data: { position: swapPosition } }),
  ])
}

export async function recordLinkClick(linkId: number): Promise<void> {
  try {
    await prisma.link.update({
      where: { id: linkId },
      data: { clicks: { increment: 1 } },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") return
    throw err
  }
}
