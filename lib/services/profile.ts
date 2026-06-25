import { prisma } from "@/lib/db"
import { saveProfileSchema } from "@/lib/validators/profile"

export class ProfileError extends Error {
  constructor(
    public readonly code: "VALIDATION_ERROR",
    message: string,
  ) {
    super(message)
    this.name = "ProfileError"
  }
}

export async function saveProfile(
  userId: number,
  input: unknown,
): Promise<void> {
  const parsed = saveProfileSchema.safeParse(input)
  if (!parsed.success) {
    throw new ProfileError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  await prisma.$transaction([
    prisma.profile.upsert({
      where: { user_id: userId },
      create: {
        user_id: userId,
        display_name: parsed.data.display_name,
        bio: parsed.data.bio ?? null,
        avatar_url: parsed.data.avatar_url ?? null,
      },
      update: {
        display_name: parsed.data.display_name,
        bio: parsed.data.bio ?? null,
        avatar_url: parsed.data.avatar_url ?? null,
      },
    }),
    ...(parsed.data.momo_number !== undefined
      ? [prisma.user.update({ where: { id: userId }, data: { momo_number: parsed.data.momo_number } })]
      : []),
  ])
}
