import { getSession } from "@/lib/auth/session"
import { NextResponse } from "next/server"
import { listNotifications } from "@/lib/services/notification"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const notifications = await listNotifications(session.userId)
  return NextResponse.json({ data: notifications })
}
