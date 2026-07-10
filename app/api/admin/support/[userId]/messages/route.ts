import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { listSupportMessages, sendAdminSupportMessage } from "@/lib/services/support"
import { z } from "zod"

type Params = { params: Promise<{ userId: string }> }

const schema = z.object({ body: z.string().min(1).max(2000) })

export async function GET(_req: Request, { params }: Params): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const { userId } = await params
  const targetUserId = parseInt(userId, 10)
  if (isNaN(targetUserId)) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 })

  const messages = await listSupportMessages(targetUserId)
  return NextResponse.json({ data: messages })
}

export async function POST(req: Request, { params }: Params): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const { userId } = await params
  const targetUserId = parseInt(userId, 10)
  if (isNaN(targetUserId)) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 })

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

  await sendAdminSupportMessage(session.userId, targetUserId, parsed.data.body)
  return NextResponse.json({ data: null }, { status: 201 })
}
