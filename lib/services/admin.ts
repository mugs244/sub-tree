import { prisma } from "@/lib/db"

export function isAdmin(userId: number): boolean {
  const adminIds = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
  return adminIds.includes(userId)
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
  await prisma.$transaction(async (tx) => {
    const claim = await tx.usernameClaim.findUnique({
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

    await tx.user.update({ where: { id: claim.user_id }, data: { username: claim.username } })
    await tx.reservedUsername.deleteMany({ where: { username: claim.username } })
    await tx.usernameClaim.update({
      where: { id: claimId },
      data: { status: "APPROVED", reviewed_at: new Date() },
    })
  })
}

export async function rejectClaim(claimId: number, message?: string): Promise<void> {
  const { count } = await prisma.usernameClaim.updateMany({
    where: { id: claimId, status: "PENDING" },
    data: { status: "REJECTED", message: message ?? null, reviewed_at: new Date() },
  })
  if (count === 0) {
    const exists = await prisma.usernameClaim.findUnique({ where: { id: claimId }, select: { id: true } })
    if (!exists) throw new Error("Claim not found")
    throw new Error("Claim is not pending")
  }
}
