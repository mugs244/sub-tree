import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { markSupportThreadRead } from "@/lib/services/support"

export async function POST(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  await markSupportThreadRead(session.userId, false)
  return NextResponse.json({ data: null })
}
