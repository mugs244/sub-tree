import { AdvertiserRole } from "@prisma/client"
import { prisma } from "@/lib/db"

export class AdvertiserTeamError extends Error {
  constructor(
    public readonly code: "FORBIDDEN" | "NOT_FOUND" | "ALREADY_MEMBER" | "LAST_OWNER" | "INVALID_ROLE" | "SELF",
    message: string,
  ) {
    super(message)
    this.name = "AdvertiserTeamError"
  }
}

export async function listTeam(advertiserId: number) {
  return prisma.advertiserMember.findMany({
    where: { advertiser_id: advertiserId },
    orderBy: [{ role: "asc" }, { invited_at: "asc" }],
    select: {
      id: true,
      role: true,
      invited_at: true,
      joined_at: true,
      user: { select: { id: true, email: true, username: true } },
    },
  })
}

// OWNER can manage everyone; ADMIN can only add/remove EDITORs (per the
// AdvertiserRole schema notes). EDITOR can't manage the team at all.
function canManageRole(actorRole: AdvertiserRole, targetRole: AdvertiserRole): boolean {
  if (actorRole === "OWNER") return true
  if (actorRole === "ADMIN") return targetRole === "EDITOR"
  return false
}

// Adds an existing Sub-tree user to the advertiser. No separate accept step
// yet — joined_at is stamped immediately (the invited_at/joined_at split
// leaves room for a real invite-accept flow later without a schema change).
export async function inviteMember(params: {
  advertiserId: number
  actorRole: AdvertiserRole
  email: string
  role: AdvertiserRole
}): Promise<{ memberId: number }> {
  const { advertiserId, actorRole, email, role } = params

  if (role === "OWNER") {
    throw new AdvertiserTeamError("INVALID_ROLE", "A second owner can't be added by invite — transfer ownership instead")
  }
  if (!canManageRole(actorRole, role)) {
    throw new AdvertiserTeamError("FORBIDDEN", "You don't have permission to add a member with that role")
  }

  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } })
  if (!user) {
    throw new AdvertiserTeamError("NOT_FOUND", "No Sub-tree account with that email — ask them to sign up first")
  }

  const existing = await prisma.advertiserMember.findUnique({
    where: { advertiser_id_user_id: { advertiser_id: advertiserId, user_id: user.id } },
    select: { id: true },
  })
  if (existing) {
    throw new AdvertiserTeamError("ALREADY_MEMBER", "That person is already on your team")
  }

  const member = await prisma.advertiserMember.create({
    data: { advertiser_id: advertiserId, user_id: user.id, role, joined_at: new Date() },
  })
  return { memberId: member.id }
}

export async function updateMemberRole(params: {
  advertiserId: number
  actorRole: AdvertiserRole
  memberId: number
  role: AdvertiserRole
}): Promise<void> {
  const { advertiserId, actorRole, memberId, role } = params
  if (actorRole !== "OWNER") {
    throw new AdvertiserTeamError("FORBIDDEN", "Only the owner can change roles")
  }

  const member = await prisma.advertiserMember.findUnique({
    where: { id: memberId },
    select: { advertiser_id: true, role: true },
  })
  if (!member || member.advertiser_id !== advertiserId) {
    throw new AdvertiserTeamError("NOT_FOUND", "Member not found")
  }

  // Guard the last owner: demoting the only OWNER would leave the account
  // with nobody able to manage billing or the team.
  if (member.role === "OWNER" && role !== "OWNER") {
    const ownerCount = await prisma.advertiserMember.count({ where: { advertiser_id: advertiserId, role: "OWNER" } })
    if (ownerCount <= 1) {
      throw new AdvertiserTeamError("LAST_OWNER", "Can't demote the only owner — promote someone else first")
    }
  }

  await prisma.advertiserMember.update({ where: { id: memberId }, data: { role } })
}

export async function removeMember(params: {
  advertiserId: number
  actorRole: AdvertiserRole
  actorUserId: number
  memberId: number
}): Promise<void> {
  const { advertiserId, actorRole, actorUserId, memberId } = params

  const member = await prisma.advertiserMember.findUnique({
    where: { id: memberId },
    select: { advertiser_id: true, role: true, user_id: true },
  })
  if (!member || member.advertiser_id !== advertiserId) {
    throw new AdvertiserTeamError("NOT_FOUND", "Member not found")
  }
  if (member.user_id === actorUserId) {
    throw new AdvertiserTeamError("SELF", "You can't remove yourself")
  }
  if (!canManageRole(actorRole, member.role)) {
    throw new AdvertiserTeamError("FORBIDDEN", "You don't have permission to remove that member")
  }
  if (member.role === "OWNER") {
    const ownerCount = await prisma.advertiserMember.count({ where: { advertiser_id: advertiserId, role: "OWNER" } })
    if (ownerCount <= 1) {
      throw new AdvertiserTeamError("LAST_OWNER", "Can't remove the only owner")
    }
  }

  await prisma.advertiserMember.delete({ where: { id: memberId } })
}
