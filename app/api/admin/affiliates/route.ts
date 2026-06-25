import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { isAdmin } from "@/lib/services/admin"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const relationships = await prisma.affiliateRelationship.findMany({
    orderBy: { created_at: "desc" },
    include: {
      affiliate_user: { select: { id: true, username: true, email: true } },
      shop_user: { select: { id: true, username: true, email: true } },
      product_grants: {
        where: { revoked_at: null },
        select: { product_id: true },
      },
    },
  })

  return NextResponse.json(
    relationships.map((rel) => ({
      id: rel.id,
      status: rel.status,
      initiated_by: rel.initiated_by,
      requested_at: rel.requested_at.toISOString(),
      reviewed_at: rel.reviewed_at?.toISOString() ?? null,
      rejected_reason: rel.rejected_reason,
      affiliate_user: {
        id: rel.affiliate_user.id,
        username: rel.affiliate_user.username,
        email: rel.affiliate_user.email,
      },
      shop_user: {
        id: rel.shop_user.id,
        username: rel.shop_user.username,
        email: rel.shop_user.email,
      },
      active_grants: rel.product_grants.length,
    })),
  )
}
