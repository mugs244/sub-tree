import { prisma } from "@/lib/db"

export function isAdmin(clerkUserId: string): boolean {
  const adminIds = (process.env.ADMIN_CLERK_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  return adminIds.includes(clerkUserId)
}

export async function listClaims(status?: "PENDING" | "APPROVED" | "REJECTED") {
  return prisma.usernameClaim.findMany({
    where: status ? { status } : undefined,
    orderBy: { created_at: "asc" },
    select: {
      id: true,
      username: true,
      status: true,
      message: true,
      created_at: true,
      reviewed_at: true,
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          profile: { select: { display_name: true } },
        },
      },
    },
  })
}

export async function approveClaim(claimId: number): Promise<void> {
  const claim = await prisma.usernameClaim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      username: true,
      status: true,
      user_id: true,
      user: { select: { username: true } },
    },
  })
  if (!claim) throw new Error("Claim not found")
  if (claim.status !== "PENDING") throw new Error("Claim is not pending")
  if (claim.user.username) throw new Error("User already has a username — cannot reassign")

  await prisma.$transaction([
    prisma.user.update({ where: { id: claim.user_id }, data: { username: claim.username } }),
    prisma.reservedUsername.deleteMany({ where: { username: claim.username } }),
    prisma.usernameClaim.update({
      where: { id: claimId },
      data: { status: "APPROVED", reviewed_at: new Date() },
    }),
  ])
}

export async function rejectClaim(claimId: number, message?: string): Promise<void> {
  const claim = await prisma.usernameClaim.findUnique({
    where: { id: claimId },
    select: { id: true, status: true },
  })
  if (!claim) throw new Error("Claim not found")
  if (claim.status !== "PENDING") throw new Error("Claim is not pending")

  await prisma.usernameClaim.update({
    where: { id: claimId },
    data: { status: "REJECTED", message: message ?? null, reviewed_at: new Date() },
  })
}
