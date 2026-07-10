import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { markSupportThreadRead } from "@/lib/services/support"

type Params = { params: Promise<{ userId: string }> }

export async function POST(_req: Request, { params }: Params): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const { userId } = await params
  const targetUserId = parseInt(userId, 10)
  if (isNaN(targetUserId)) return NextResponse.json({ error: "INVALID_ID" }, { status: 400 })

  await markSupportThreadRead(targetUserId, true)
  return NextResponse.json({ data: null })
}
