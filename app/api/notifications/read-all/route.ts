import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { markAllNotificationsRead } from "@/lib/services/notification"

// Called by the Activity feed once it has shown the creator their updates.
export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  await markAllNotificationsRead(session.userId)
  return NextResponse.json({ data: { ok: true } })
}
