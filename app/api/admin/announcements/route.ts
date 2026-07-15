import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { broadcastAnnouncement } from "@/lib/services/notification"

const schema = z.object({
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(2000),
  targetUserId: z.number().int().positive().optional(),
})

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
  }

  const count = await broadcastAnnouncement({
    title: parsed.data.title,
    body: parsed.data.body,
    targetUserId: parsed.data.targetUserId,
  })

  return NextResponse.json({ data: { sentTo: count } }, { status: 201 })
}
