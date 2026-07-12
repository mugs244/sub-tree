import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db"
import { usernameSchema } from "@/lib/validators/username"
import { sendWelcomeEmail } from "@/lib/auth/email"

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

export async function claimUsername(userId: number, username: string): Promise<void> {
  const parseResult = usernameSchema.safeParse(username)
  if (!parseResult.success) {
    throw new UsernameError("INVALID_USERNAME", parseResult.error.issues[0]?.message ?? "Invalid username")
  }

  let email: string
  try {
    const user = await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true, email: true },
      })
      if (!existing) throw new UsernameError("ALREADY_HAS_USERNAME", "User already has a username")
      if (existing.username) throw new UsernameError("ALREADY_HAS_USERNAME", "User already has a username")

      const [taken, reserved] = await Promise.all([
        tx.user.findUnique({ where: { username }, select: { id: true } }),
        tx.reservedUsername.findUnique({ where: { username }, select: { id: true } }),
      ])

      if (taken) throw new UsernameError("USERNAME_TAKEN", `@${username} is already taken`)
      if (reserved) throw new UsernameError("USERNAME_RESERVED", `@${username} is a reserved username`)

      return tx.user.update({
        where: { id: userId },
        data: { username },
        select: { email: true },
      })
    })
    email = user.email
  } catch (err) {
    if (err instanceof UsernameError) throw err
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002" &&
      (err.meta?.target as string[] | undefined)?.includes("username")
    ) {
      throw new UsernameError("USERNAME_TAKEN", `@${username} is already taken`)
    }
    throw err
  }

  try {
    await sendWelcomeEmail(email, username)
  } catch (err) {
    console.error("Welcome email send failed", { userId, err })
  }
}

// Unlike claimUsername (onboarding, requires no existing username and sends
// a welcome email), this is the settings-page rename path: requires an
// existing username, no welcome email. The old username isn't reserved —
// overwriting the unique column frees it immediately for anyone (including
// this same user later) to claim.
export async function renameUsername(userId: number, username: string): Promise<void> {
  const parseResult = usernameSchema.safeParse(username)
  if (!parseResult.success) {
    throw new UsernameError("INVALID_USERNAME", parseResult.error.issues[0]?.message ?? "Invalid username")
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { id: userId },
        select: { username: true },
      })
      if (!existing?.username) throw new UsernameError("NO_EXISTING_USERNAME", "No existing username to rename")
      if (existing.username === username) return

      const [taken, reserved] = await Promise.all([
        tx.user.findUnique({ where: { username }, select: { id: true } }),
        tx.reservedUsername.findUnique({ where: { username }, select: { id: true } }),
      ])

      if (taken) throw new UsernameError("USERNAME_TAKEN", `@${username} is already taken`)
      if (reserved) throw new UsernameError("USERNAME_RESERVED", `@${username} is a reserved username`)

      await tx.user.update({ where: { id: userId }, data: { username } })
    })
  } catch (err) {
    if (err instanceof UsernameError) throw err
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002" &&
      (err.meta?.target as string[] | undefined)?.includes("username")
    ) {
      throw new UsernameError("USERNAME_TAKEN", `@${username} is already taken`)
    }
    throw err
  }
}

export async function requestReservedUsername(userId: number, username: string): Promise<void> {
  const parseResult = usernameSchema.safeParse(username)
  if (!parseResult.success) {
    throw new UsernameError("INVALID_USERNAME", parseResult.error.issues[0]?.message ?? "Invalid username")
  }

  const reserved = await prisma.reservedUsername.findUnique({ where: { username }, select: { id: true } })
  if (!reserved) throw new UsernameError("USERNAME_NOT_RESERVED", `@${username} is not a reserved username`)

  const existing = await prisma.usernameClaim.findFirst({
    where: { user_id: userId, username, status: "PENDING" },
    select: { id: true },
  })
  if (existing) return // idempotent

  await prisma.usernameClaim.create({
    data: { user_id: userId, username, status: "PENDING" },
  })
}

export class UsernameError extends Error {
  constructor(
    public readonly code:
      | "INVALID_USERNAME"
      | "USERNAME_TAKEN"
      | "USERNAME_RESERVED"
      | "USERNAME_NOT_RESERVED"
      | "ALREADY_HAS_USERNAME"
      | "NO_EXISTING_USERNAME",
    message: string,
  ) {
    super(message)
    this.name = "UsernameError"
  }
}
