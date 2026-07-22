import { ContentMediaType } from "@prisma/client"
import { prisma } from "@/lib/db"

export class ContentError extends Error {
  constructor(public readonly code: "INVALID_MEDIA" | "NOT_FOUND", message: string) {
    super(message)
    this.name = "ContentError"
  }
}

export interface CreateContentInput {
  caption?: string
  mediaUrl: string
  mediaType?: ContentMediaType
  durationSec?: number
}

export async function createContentItem(creatorId: number, input: CreateContentInput): Promise<{ contentId: number }> {
  const mediaUrl = input.mediaUrl?.trim()
  if (!mediaUrl) throw new ContentError("INVALID_MEDIA", "A media reference is required")

  const item = await prisma.contentItem.create({
    data: {
      creator_id: creatorId,
      caption: input.caption?.trim() || null,
      media_url: mediaUrl,
      media_type: input.mediaType ?? "VIDEO",
      duration_sec: input.durationSec,
    },
  })
  return { contentId: item.id }
}

export async function listContentForCreator(creatorId: number, limit = 30) {
  return prisma.contentItem.findMany({
    where: { creator_id: creatorId, deleted_at: null },
    orderBy: { created_at: "desc" },
    take: limit,
    select: { id: true, caption: true, media_url: true, media_type: true, duration_sec: true, view_count: true, created_at: true },
  })
}

export async function deleteContentItem(creatorId: number, contentId: number): Promise<void> {
  const item = await prisma.contentItem.findUnique({
    where: { id: contentId },
    select: { creator_id: true, deleted_at: true },
  })
  if (!item || item.creator_id !== creatorId || item.deleted_at) {
    throw new ContentError("NOT_FOUND", "Content not found")
  }
  await prisma.contentItem.update({ where: { id: contentId }, data: { deleted_at: new Date() } })
}
