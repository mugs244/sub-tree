import { prisma } from "@/lib/db"

export class AdvertiserPostError extends Error {
  constructor(
    public readonly code: "NOT_FOUND" | "EMPTY" | "TOO_LONG",
    message: string,
  ) {
    super(message)
    this.name = "AdvertiserPostError"
  }
}

const MAX_POST_LENGTH = 5000
const MAX_COMMENT_LENGTH = 2000

export async function createPost(advertiserId: number, authorId: number, content: string): Promise<{ postId: number }> {
  const trimmed = content.trim()
  if (trimmed.length === 0) throw new AdvertiserPostError("EMPTY", "Write something to post")
  if (trimmed.length > MAX_POST_LENGTH) throw new AdvertiserPostError("TOO_LONG", "Post is too long")

  const post = await prisma.advertiserPost.create({
    data: { advertiser_id: advertiserId, author_id: authorId, content: trimmed },
  })
  return { postId: post.id }
}

// Newest first, with comment counts for the list view. Soft-deleted posts
// (deleted_at set) are excluded.
export async function listPosts(advertiserId: number) {
  const posts = await prisma.advertiserPost.findMany({
    where: { advertiser_id: advertiserId, deleted_at: null },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      content: true,
      created_at: true,
      author: { select: { username: true, email: true } },
      _count: { select: { comments: { where: { deleted_at: null } } } },
    },
  })
  return posts.map((p) => ({
    id: p.id,
    content: p.content,
    createdAt: p.created_at,
    authorName: p.author.username ? `@${p.author.username}` : p.author.email,
    commentCount: p._count.comments,
  }))
}

export async function deletePost(advertiserId: number, postId: number): Promise<void> {
  const post = await prisma.advertiserPost.findUnique({
    where: { id: postId },
    select: { advertiser_id: true, deleted_at: true },
  })
  if (!post || post.advertiser_id !== advertiserId || post.deleted_at) {
    throw new AdvertiserPostError("NOT_FOUND", "Post not found")
  }
  await prisma.advertiserPost.update({ where: { id: postId }, data: { deleted_at: new Date() } })
}

// Comments live inside the post — the business opens a post to read them.
// Scoped to the advertiser so one business can't read another's comments.
export async function listComments(advertiserId: number, postId: number) {
  const post = await prisma.advertiserPost.findUnique({
    where: { id: postId },
    select: { advertiser_id: true, deleted_at: true },
  })
  if (!post || post.advertiser_id !== advertiserId || post.deleted_at) {
    throw new AdvertiserPostError("NOT_FOUND", "Post not found")
  }

  const comments = await prisma.advertiserPostComment.findMany({
    where: { post_id: postId, deleted_at: null },
    orderBy: { created_at: "asc" },
    select: {
      id: true,
      body: true,
      created_at: true,
      author: { select: { username: true, email: true } },
    },
  })
  return comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    authorName: c.author.username ? `@${c.author.username}` : c.author.email,
  }))
}

// Any Sub-tree user can comment on a business post (they'd reach it from the
// public surface, deferred). Not advertiser-scoped: the commenter is a
// viewer, so the only check is that the post exists and is live.
export async function addComment(postId: number, authorId: number, body: string): Promise<{ commentId: number }> {
  const trimmed = body.trim()
  if (trimmed.length === 0) throw new AdvertiserPostError("EMPTY", "Write a comment")
  if (trimmed.length > MAX_COMMENT_LENGTH) throw new AdvertiserPostError("TOO_LONG", "Comment is too long")

  const post = await prisma.advertiserPost.findUnique({
    where: { id: postId },
    select: { deleted_at: true },
  })
  if (!post || post.deleted_at) throw new AdvertiserPostError("NOT_FOUND", "Post not found")

  const comment = await prisma.advertiserPostComment.create({
    data: { post_id: postId, author_id: authorId, body: trimmed },
  })
  return { commentId: comment.id }
}
