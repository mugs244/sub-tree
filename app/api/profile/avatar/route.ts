import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

// Saves just the profile photo, straight after it's uploaded — like WhatsApp,
// picking a photo is enough; there's no separate Save to forget.
// Only accepts photos from our public Blob store (or a Google profile photo).
const schema = z.object({
  avatar_url: z
    .string()
    .url()
    .max(500)
    .refine((u) => {
      const host = new URL(u).hostname
      return u.startsWith("https://") && (host.endsWith(".public.blob.vercel-storage.com") || host.endsWith(".googleusercontent.com"))
    }, "Unsupported photo address")
    .nullable(),
})

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid photo" }, { status: 400 })
  }

  const updated = await prisma.profile.updateMany({
    where: { user_id: session.userId },
    data: { avatar_url: parsed.data.avatar_url },
  })
  if (updated.count === 0) {
    return NextResponse.json({ error: "NO_PROFILE", message: "Set up your profile first" }, { status: 404 })
  }
  return NextResponse.json({ data: { avatar_url: parsed.data.avatar_url } })
}
