import { prisma } from "@/lib/db"
import { z } from "zod"

export class PostError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "VALIDATION_ERROR"
      | "ALREADY_LIKED"
      | "NOT_LIKED",
    message: string,
  ) {
    super(message)
    this.name = "PostError"
  }
}

// ── Validators ────────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
  content:    z.string().max(5000).trim().optional(),
  visibility: z.enum(["PUBLIC", "SUPPORTERS_ONLY", "SUBSCRIBERS_ONLY"]).default("PUBLIC"),
  link_url:   z.url("Must be a valid URL").optional(),
}).refine((d) => d.content || d.link_url, "Post must have content or a link")

export const updatePostSchema = z.object({
  content:    z.string().max(5000).trim().nullable().optional(),
  visibility: z.enum(["PUBLIC", "SUPPORTERS_ONLY", "SUBSCRIBERS_ONLY"]).optional(),
  link_url:   z.string().nullable().optional(),
}).refine((d) => Object.keys(d).length > 0, "At least one field required")

// ── Helpers ───────────────────────────────────────────────────────────────────

async function resolvePost(postId: number, userId: number) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { links: true },
  })
  if (!post || post.deleted_at) throw new PostError("NOT_FOUND", "Post not found")
  if (post.user_id !== userId) throw new PostError("FORBIDDEN", "Not your post")
  return post
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function listCreatorPosts(userId: number) {
  return prisma.post.findMany({
    where: { user_id: userId, deleted_at: null },
    orderBy: [{ is_pinned: "desc" }, { published_at: "desc" }],
    select: {
      id: true, content: true, visibility: true,
      is_pinned: true, like_count: true, view_count: true, published_at: true,
      links: { select: { id: true, url: true, smart_card_meta: true } },
    },
  })
}

export async function getPublicPosts(handle: string, viewerUserId: number | null) {
  const creator = await prisma.user.findUnique({
    where: { username: handle },
    select: { id: true },
  })
  if (!creator) return null

  // Determine viewer's access level
  let isSupporter = false
  let isSubscriber = false

  if (viewerUserId) {
    const [donationCount] = await Promise.all([
      prisma.donation.count({
        where: { user_id: creator.id, donor_phone: { not: "" }, status: "COMPLETED" },
      }),
    ])
    isSupporter = donationCount > 0
    // Subscriber check will be added when Feature 51 (subscriptions) ships
  }

  const posts = await prisma.post.findMany({
    where: { user_id: creator.id, deleted_at: null },
    orderBy: [{ is_pinned: "desc" }, { published_at: "desc" }],
    select: {
      id: true, content: true, visibility: true,
      is_pinned: true, like_count: true, view_count: true, published_at: true,
      links: { select: { id: true, url: true, smart_card_meta: true } },
      likes: viewerUserId
        ? { where: { user_id: viewerUserId }, select: { id: true } }
        : false,
    },
  })

  return posts.map((post) => {
    const locked =
      (post.visibility === "SUPPORTERS_ONLY" && !isSupporter) ||
      (post.visibility === "SUBSCRIBERS_ONLY" && !isSubscriber)

    return {
      ...post,
      liked: viewerUserId ? post.likes.length > 0 : false,
      locked,
      // Blur content for locked posts
      content: locked && post.content ? post.content.slice(0, 120) + "…" : post.content,
      links: locked ? [] : post.links,
    }
  })
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createPost(userId: number, input: unknown) {
  const parsed = createPostSchema.safeParse(input)
  if (!parsed.success) {
    throw new PostError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const { content, visibility, link_url } = parsed.data

  return prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: { user_id: userId, content, visibility },
      select: { id: true },
    })
    if (link_url) {
      await tx.postLink.create({ data: { post_id: post.id, url: link_url } })
    }
    await tx.feedEvent.create({
      data: {
        creator_id: userId,
        event_type: "POST_PUBLISHED",
        resource_id: post.id,
        resource_type: "post",
      },
    })
    return post
  })
}

export async function updatePost(userId: number, postId: number, input: unknown) {
  const parsed = updatePostSchema.safeParse(input)
  if (!parsed.success) {
    throw new PostError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  await resolvePost(postId, userId)

  const { content, visibility, link_url } = parsed.data

  await prisma.$transaction(async (tx) => {
    await tx.post.update({
      where: { id: postId },
      data: {
        ...(content !== undefined ? { content } : {}),
        ...(visibility !== undefined ? { visibility } : {}),
      },
    })
    if (link_url !== undefined) {
      await tx.postLink.deleteMany({ where: { post_id: postId } })
      if (link_url) {
        await tx.postLink.create({ data: { post_id: postId, url: link_url } })
      }
    }
  })
}

export async function deletePost(userId: number, postId: number) {
  await resolvePost(postId, userId)
  await prisma.post.update({
    where: { id: postId },
    data: { deleted_at: new Date() },
  })
}

export async function pinPost(userId: number, postId: number) {
  await resolvePost(postId, userId)

  await prisma.$transaction([
    prisma.post.updateMany({ where: { user_id: userId, is_pinned: true }, data: { is_pinned: false } }),
    prisma.post.update({ where: { id: postId }, data: { is_pinned: true } }),
  ])
}

export async function likePost(userId: number, postId: number) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, deleted_at: true } })
  if (!post || post.deleted_at) throw new PostError("NOT_FOUND", "Post not found")

  const existing = await prisma.postLike.findUnique({
    where: { post_id_user_id: { post_id: postId, user_id: userId } },
  })
  if (existing) throw new PostError("ALREADY_LIKED", "Already liked this post")

  await prisma.$transaction([
    prisma.postLike.create({ data: { post_id: postId, user_id: userId } }),
    prisma.post.update({ where: { id: postId }, data: { like_count: { increment: 1 } } }),
  ])
}

export async function unlikePost(userId: number, postId: number) {
  const existing = await prisma.postLike.findUnique({
    where: { post_id_user_id: { post_id: postId, user_id: userId } },
  })
  if (!existing) throw new PostError("NOT_LIKED", "Not liked")

  await prisma.$transaction([
    prisma.postLike.delete({ where: { post_id_user_id: { post_id: postId, user_id: userId } } }),
    prisma.post.update({ where: { id: postId }, data: { like_count: { decrement: 1 } } }),
  ])
}
