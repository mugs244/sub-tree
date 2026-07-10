import { getSession } from "@/lib/auth/session"
import { NextResponse } from "next/server"
import { markNotificationRead } from "@/lib/services/notification"

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const { id } = await params
  const notificationId = parseInt(id, 10)
  if (isNaN(notificationId)) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 })

  await markNotificationRead(session.userId, notificationId)
  return NextResponse.json({ data: { ok: true } })
}
