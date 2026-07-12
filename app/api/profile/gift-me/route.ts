import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

const bodySchema = z.object({ enabled: z.boolean() })

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return new NextResponse("Unauthorized", { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    )
  }

  await prisma.profile.update({
    where: { user_id: session.userId },
    data: { gift_me_enabled: parsed.data.enabled },
  })

  return NextResponse.json({ data: { enabled: parsed.data.enabled } })
}
