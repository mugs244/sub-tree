import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"

const ADMIN_IDS = (process.env.ADMIN_CLERK_IDS ?? "").split(",").filter(Boolean)

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId || !ADMIN_IDS.includes(userId)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const logs = await prisma.platformSettingAuditLog.findMany({
    orderBy: { changed_at: "desc" },
    take: 200,
  })

  return NextResponse.json({ data: logs })
}
