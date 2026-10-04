import { prisma } from "@/lib/db"

function idsFrom(value: string | undefined): number[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
}

function getAdminIds(): number[] {
  return idsFrom(process.env.ADMIN_USER_IDS)
}

export function isAdmin(userId: number): boolean {
  return getAdminIds().includes(userId)
}

export function getAllAdminIds(): number[] {
  return getAdminIds()
}

// Super admins (SUPER_ADMIN_USER_IDS, a subset of the admins) can always
// switch to the Sub-shop admin portal and decide which other admins may.
export function isSuperAdmin(userId: number): boolean {
  return isAdmin(userId) && idsFrom(process.env.SUPER_ADMIN_USER_IDS).includes(userId)
}

export async function canAccessSubShopAdmin(userId: number): Promise<boolean> {
  if (!isAdmin(userId)) return false
  if (isSuperAdmin(userId)) return true
  const perm = await prisma.adminPermission.findUnique({ where: { user_id: userId }, select: { can_access_subshop: true } })
  return Boolean(perm?.can_access_subshop)
}

// Where "Switch to Sub-shop admin" goes.
export function subShopAdminUrl(): string {
  return process.env.SUBSHOP_ADMIN_URL || "https://shop.sub-tree.com/dashboard"
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
