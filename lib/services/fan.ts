import { prisma } from "@/lib/db"

export class FanError extends Error {
  constructor(
    public readonly code:
      | "USER_NOT_FOUND"
      | "CREATOR_NOT_FOUND"
      | "ALREADY_FOLLOWING"
      | "NOT_FOLLOWING"
      | "SELF_FOLLOW",
    message: string,
  ) {
    super(message)
    this.name = "FanError"
  }
}

async function resolveUser(clerkUserId: string) {
  const user = await prisma.user.findUnique({
    where: { clerk_user_id: clerkUserId },
    select: { id: true, account_type: true },
  })
  if (!user) throw new FanError("USER_NOT_FOUND", "User not found")
  return user
}

export async function followCreator(clerkUserId: string, creatorHandle: string) {
  const fan = await resolveUser(clerkUserId)

  const creator = await prisma.user.findUnique({
    where: { username: creatorHandle },
    select: { id: true, deleted_at: true },
  })
  if (!creator || creator.deleted_at) throw new FanError("CREATOR_NOT_FOUND", "Creator not found")
  if (creator.id === fan.id) throw new FanError("SELF_FOLLOW", "You cannot follow yourself")

  const existing = await prisma.follow.findUnique({
    where: { follower_id_creator_id: { follower_id: fan.id, creator_id: creator.id } },
  })
  if (existing) throw new FanError("ALREADY_FOLLOWING", "Already following this creator")

  await prisma.follow.create({
    data: { follower_id: fan.id, creator_id: creator.id },
  })
}

export async function unfollowCreator(clerkUserId: string, creatorHandle: string) {
  const fan = await resolveUser(clerkUserId)

  const creator = await prisma.user.findUnique({
    where: { username: creatorHandle },
    select: { id: true },
  })
  if (!creator) throw new FanError("CREATOR_NOT_FOUND", "Creator not found")

  const existing = await prisma.follow.findUnique({
    where: { follower_id_creator_id: { follower_id: fan.id, creator_id: creator.id } },
  })
  if (!existing) throw new FanError("NOT_FOLLOWING", "Not following this creator")

  await prisma.follow.delete({
    where: { follower_id_creator_id: { follower_id: fan.id, creator_id: creator.id } },
  })
}

export async function getFanFeed(clerkUserId: string) {
  const fan = await resolveUser(clerkUserId)

  const follows = await prisma.follow.findMany({
    where: { follower_id: fan.id },
    select: { creator_id: true },
  })
  if (follows.length === 0) return []

  const creatorIds = follows.map((f) => f.creator_id)

  // Check which creators the fan has donated to (for SUPPORTERS_ONLY gating)
  const supportedCreatorIds = new Set(
    (await prisma.donation.findMany({
      where: { user_id: { in: creatorIds }, status: "COMPLETED" },
      select: { user_id: true },
      distinct: ["user_id"],
    })).map((d) => d.user_id)
  )

  const posts = await prisma.post.findMany({
    where: { user_id: { in: creatorIds }, deleted_at: null },
    orderBy: { published_at: "desc" },
    take: 60,
    select: {
      id: true, content: true, visibility: true,
      is_pinned: true, like_count: true, published_at: true,
      user: {
        select: {
          id: true, username: true,
          profile: { select: { display_name: true, avatar_url: true } },
        },
      },
      links: { select: { id: true, url: true } },
      likes: { where: { user_id: fan.id }, select: { id: true } },
    },
  })

  return posts.map((post) => {
    const isSupporter = supportedCreatorIds.has(post.user.id)
    const locked =
      (post.visibility === "SUPPORTERS_ONLY" && !isSupporter) ||
      post.visibility === "SUBSCRIBERS_ONLY"

    return {
      ...post,
      liked: post.likes.length > 0,
      locked,
      content: locked && post.content ? post.content.slice(0, 120) + "…" : post.content,
      links: locked ? [] : post.links,
    }
  })
}

export async function getFanFollowing(clerkUserId: string) {
  const fan = await resolveUser(clerkUserId)

  return prisma.follow.findMany({
    where: { follower_id: fan.id },
    orderBy: { followed_at: "desc" },
    select: {
      id: true,
      followed_at: true,
      creator: {
        select: {
          username: true,
          profile: { select: { display_name: true, avatar_url: true, bio: true } },
          _count: { select: { followers: true } },
        },
      },
    },
  })
}

export async function getFanSupportHistory(clerkUserId: string) {
  const user = await prisma.user.findUnique({
    where: { clerk_user_id: clerkUserId },
    select: { id: true, account_type: true, phone: true },
  })
  if (!user) throw new FanError("USER_NOT_FOUND", "User not found")
  if (!user.phone) return []

  return prisma.donation.findMany({
    where: { donor_phone: user.phone, status: "COMPLETED" },
    orderBy: { created_at: "desc" },
    take: 100,
    select: {
      id: true, amount: true, currency: true, created_at: true, note: true,
      user: {
        select: {
          username: true,
          profile: { select: { display_name: true, avatar_url: true } },
        },
      },
    },
  })
}

export async function getCreatorFollowStats(creatorId: number, viewerClerkId: string | null) {
  const [followerCount, isFollowing] = await Promise.all([
    prisma.follow.count({ where: { creator_id: creatorId } }),
    viewerClerkId
      ? prisma.user.findUnique({
          where: { clerk_user_id: viewerClerkId },
          select: { id: true },
        }).then((viewer) =>
          viewer
            ? prisma.follow.findUnique({
                where: { follower_id_creator_id: { follower_id: viewer.id, creator_id: creatorId } },
              }).then(Boolean)
            : false
        )
      : Promise.resolve(false),
  ])
  return { followerCount, isFollowing }
}
