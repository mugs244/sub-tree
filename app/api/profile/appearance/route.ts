import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"
import { prisma } from "@/lib/db"

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional()
const fontKey = z.enum(["geist", "inter", "playfair", "space-grotesk"]).nullable().optional()

const baseSchema = z.object({
  theme_preset: z.enum(["default", "warm", "cool", "forest", "midnight",
    "rose", "violet", "amber", "teal", "slate", "crimson", "sage", "dusk"]).optional(),
  button_style: z.enum(["rounded", "pill", "sharp"]).optional(),
})

const proSchema = z.object({
  theme_bg_color:     hexColor,
  theme_accent_color: hexColor,
  theme_button_color: hexColor,
  theme_button_text:  hexColor,
  theme_card_bg:      hexColor,
  theme_card_text:    hexColor,
  theme_font:         fontKey,
  hide_branding:      z.boolean().optional(),
})

const PRO_TIERS = ["PRO", "BUSINESS", "CONTENT_HOUSE"]

export async function POST(req: Request): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const baseParsed = baseSchema.safeParse(body)
  if (!baseParsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: baseParsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    )
  }

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true, tier: true },
  })
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND", message: "User not found" }, { status: 404 })

  const isPro = PRO_TIERS.includes(user.tier)

  // Check if body contains Pro-only fields
  const bodyObj = body as Record<string, unknown>
  const hasProFields = Object.keys(proSchema.shape).some((k) => k in bodyObj)
  if (hasProFields && !isPro) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "Pro tier required for custom theme settings" },
      { status: 403 },
    )
  }

  const updateData: Record<string, unknown> = { ...baseParsed.data }

  if (isPro && hasProFields) {
    const proParsed = proSchema.safeParse(body)
    if (!proParsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: proParsed.error.issues[0]?.message ?? "Invalid Pro field" },
        { status: 400 },
      )
    }
    Object.assign(updateData, proParsed.data)
  }

  await prisma.profile.upsert({
    where: { user_id: user.id },
    create: { user_id: user.id, display_name: "", ...updateData },
    update: updateData,
  })

  return NextResponse.json({ data: null })
}

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return new NextResponse("Unauthorized", { status: 401 })

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: {
      tier: true,
      profile: {
        select: {
          theme_preset: true,
          button_style: true,
          theme_bg_color: true,
          theme_accent_color: true,
          theme_button_color: true,
          theme_button_text: true,
          theme_card_bg: true,
          theme_card_text: true,
          theme_font: true,
          hide_branding: true,
        },
      },
    },
  })
  if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 })

  return NextResponse.json({ tier: user.tier, profile: user.profile })
}
