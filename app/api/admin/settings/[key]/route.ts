import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { updateSetting } from "@/lib/services/platform-settings"
import { z } from "zod"

type Props = { params: Promise<{ key: string }> }

const ADMIN_IDS = (process.env.ADMIN_CLERK_IDS ?? "").split(",").filter(Boolean)

const schema = z.object({ value: z.string().min(1) })

function validateSettingValue(key: string, value: string): string | null {
  if (key.startsWith("fee_")) {
    const n = parseFloat(value)
    if (isNaN(n) || n < 0 || n > 0.3) {
      return "Fee values must be a number between 0.0 and 0.30"
    }
    return null
  }
  if (
    key === "platform_maintenance_mode" ||
    key === "fee_subscription_progressive_enabled"
  ) {
    if (value !== "true" && value !== "false") {
      return "Boolean values must be 'true' or 'false'"
    }
    return null
  }
  const n = parseInt(value, 10)
  if (isNaN(n) || n < 0) {
    return "Integer values must be a non-negative integer"
  }
  return null
}

export async function PATCH(req: Request, { params }: Props): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId || !ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const { key } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message },
      { status: 400 },
    )
  }

  const validationError = validateSettingValue(key, parsed.data.value)
  if (validationError) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: validationError }, { status: 400 })
  }

  const dbUser = await prisma.user.findFirst({ where: { clerk_user_id: userId } })
  if (!dbUser) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  await updateSetting(key, parsed.data.value, dbUser.id)

  return NextResponse.json({ data: { ok: true } })
}
