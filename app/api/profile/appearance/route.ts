import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { prisma } from "@/lib/db"

const appearanceSchema = z.object({
  theme_preset: z.enum(["default", "warm", "cool", "forest", "midnight"]),
  button_style: z.enum(["rounded", "pill", "sharp"]),
})

export async function POST(req: Request): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = appearanceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    )
  }

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND", message: "User not found" }, { status: 404 })

  await prisma.profile.upsert({
    where: { user_id: user.id },
    create: { user_id: user.id, display_name: "", theme_preset: parsed.data.theme_preset, button_style: parsed.data.button_style },
    update: { theme_preset: parsed.data.theme_preset, button_style: parsed.data.button_style },
  })

  return NextResponse.json({ data: null })
}
