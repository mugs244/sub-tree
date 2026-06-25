import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const users = await prisma.user.findMany({
    orderBy: { last_active_at: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      phone: true,
      account_type: true,
      tier: true,
      last_active_at: true,
      created_at: true,
      deleted_at: true,
      profile: { select: { display_name: true, country_code: true } },
    },
  })

  return NextResponse.json(
    users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      account_type: user.account_type,
      tier: user.tier,
      last_active_at: user.last_active_at?.toISOString() ?? null,
      created_at: user.created_at.toISOString(),
      suspended: user.deleted_at !== null,
      display_name: user.profile?.display_name ?? null,
      country_code: user.profile?.country_code ?? null,
    })),
  )
}
