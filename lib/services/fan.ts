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
