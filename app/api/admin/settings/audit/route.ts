import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { prisma } from "@/lib/db"

export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const logs = await prisma.platformSettingAuditLog.findMany({
    orderBy: { changed_at: "desc" },
    take: 200,
  })

  return NextResponse.json({ data: logs })
}
