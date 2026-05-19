import { prisma } from "@/lib/db"
import { saveProfileSchema } from "@/lib/validators/profile"

export class ProfileError extends Error {
  constructor(
    public readonly code: "USER_NOT_FOUND" | "VALIDATION_ERROR",
    message: string,
  ) {
    super(message)
    this.name = "ProfileError"
  }
}

export async function saveProfile(
  clerkUserId: string,
  input: unknown,
): Promise<void> {
  const parsed = saveProfileSchema.safeParse(input)
  if (!parsed.success) {
    throw new ProfileError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: clerkUserId },
    select: { id: true },
  })
  if (!user) throw new ProfileError("USER_NOT_FOUND", "User record not found")

  await prisma.profile.upsert({
    where: { user_id: user.id },
    create: {
      user_id: user.id,
      display_name: parsed.data.display_name,
      bio: parsed.data.bio ?? null,
      avatar_url: parsed.data.avatar_url ?? null,
    },
    update: {
      display_name: parsed.data.display_name,
      bio: parsed.data.bio ?? null,
      avatar_url: parsed.data.avatar_url ?? null,
    },
  })
}
