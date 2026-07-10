import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { listSupportMessages, sendCreatorSupportMessage } from "@/lib/services/support"
import { z } from "zod"

const schema = z.object({ body: z.string().min(1).max(2000) })

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const messages = await listSupportMessages(session.userId)
  return NextResponse.json({ data: messages })
}

export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

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

  await sendCreatorSupportMessage(session.userId, parsed.data.body)
  return NextResponse.json({ data: null }, { status: 201 })
}
