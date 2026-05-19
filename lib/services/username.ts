import { prisma } from "@/lib/db"
import { usernameSchema } from "@/lib/validators/username"

export type UsernameAvailability =
  | { status: "available" }
  | { status: "taken" }
  | { status: "reserved" }
  | { status: "invalid"; reason: string }

export async function checkUsernameAvailability(
  username: string,
): Promise<UsernameAvailability> {
  const result = usernameSchema.safeParse(username)
  if (!result.success) {
    return { status: "invalid", reason: result.error.issues[0]?.message ?? "Invalid username" }
  }

  const [taken, reserved] = await Promise.all([
    prisma.user.findUnique({ where: { username }, select: { id: true } }),
    prisma.reservedUsername.findUnique({ where: { username }, select: { id: true } }),
  ])

  if (taken) return { status: "taken" }
  if (reserved) return { status: "reserved" }
  return { status: "available" }
}

export async function claimUsername(clerkUserId: string, username: string): Promise<void> {
  const parseResult = usernameSchema.safeParse(username)
  if (!parseResult.success) {
    throw new UsernameError("INVALID_USERNAME", parseResult.error.issues[0]?.message ?? "Invalid username")
  }

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { clerk_user_id: clerkUserId },
      select: { id: true, username: true },
    })
    if (!user) throw new UsernameError("USER_NOT_FOUND", "User record not found")
    if (user.username) throw new UsernameError("ALREADY_HAS_USERNAME", "User already has a username")

    const [taken, reserved] = await Promise.all([
      tx.user.findUnique({ where: { username }, select: { id: true } }),
      tx.reservedUsername.findUnique({ where: { username }, select: { id: true } }),
    ])

    if (taken) throw new UsernameError("USERNAME_TAKEN", `@${username} is already taken`)
    if (reserved) throw new UsernameError("USERNAME_RESERVED", `@${username} is a reserved username`)

    await tx.user.update({
      where: { id: user.id },
      data: { username },
    })
  })
}

export class UsernameError extends Error {
  constructor(
    public readonly code:
      | "INVALID_USERNAME"
      | "USERNAME_TAKEN"
      | "USERNAME_RESERVED"
      | "USER_NOT_FOUND"
      | "ALREADY_HAS_USERNAME",
    message: string,
  ) {
    super(message)
    this.name = "UsernameError"
  }
}
