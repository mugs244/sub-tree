import { prisma } from "@/lib/db"
import { addLinkSchema } from "@/lib/validators/link"

export class LinkError extends Error {
  constructor(
    public readonly code: "USER_NOT_FOUND" | "VALIDATION_ERROR",
    message: string,
  ) {
    super(message)
    this.name = "LinkError"
  }
}

export async function addLink(
  clerkUserId: string,
  input: unknown,
): Promise<void> {
  const parsed = addLinkSchema.safeParse(input)
  if (!parsed.success) {
    throw new LinkError("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input")
  }

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: clerkUserId },
    select: { id: true },
  })
  if (!user) throw new LinkError("USER_NOT_FOUND", "User record not found")

  const maxPosition = await prisma.link.aggregate({
    where: { user_id: user.id },
    _max: { position: true },
  })

  await prisma.link.create({
    data: {
      user_id: user.id,
      url: parsed.data.url,
      label: parsed.data.label,
      position: (maxPosition._max.position ?? -1) + 1,
    },
  })
}
