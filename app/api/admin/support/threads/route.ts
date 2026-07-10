import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { listSupportThreads } from "@/lib/services/support"

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const threads = await listSupportThreads()
  return NextResponse.json({ data: threads })
}
