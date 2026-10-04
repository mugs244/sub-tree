import { NextResponse } from "next/server"
import { z } from "zod"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { isAdmin, isSuperAdmin } from "@/lib/services/admin"
import { inviteSubShopAdmin, removeSubShopAdmin, subShopAdminSyncConfigured, SubShopAdminError } from "@/lib/services/subshop-admin"

const schema = z.object({ userId: z.number().int(), canAccessSubShop: z.boolean() })

// Admin → Team (super admins only): let another admin switch to the Sub-shop
// admin portal, or take that away. Also creates/removes their Sub-shop login
// when the Sub-shop API keys are set.
export async function POST(req: Request): Promise<NextResponse> {
  const session = await getSession()
  if (!session || !isSuperAdmin(session.userId)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "VALIDATION_ERROR" }, { status: 400 })
  const { userId, canAccessSubShop } = parsed.data

  if (!isAdmin(userId)) return NextResponse.json({ error: "NOT_ADMIN", message: "That person isn't an admin" }, { status: 400 })
  if (isSuperAdmin(userId)) return NextResponse.json({ error: "SUPER_ADMIN", message: "Super admins always have access" }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (!user) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 })

  await prisma.adminPermission.upsert({
    where: { user_id: userId },
    create: { user_id: userId, can_access_subshop: canAccessSubShop, granted_by: session.userId },
    update: { can_access_subshop: canAccessSubShop, granted_by: session.userId },
  })

  // Keep the Sub-shop admin login in step with the permission.
  let inviteUrl: string | null = null
  let syncNote: string | null = null
  if (subShopAdminSyncConfigured()) {
    try {
      if (canAccessSubShop) {
        const invite = await inviteSubShopAdmin(user.email)
        inviteUrl = invite?.inviteUrl ?? null
        syncNote = invite ? "Send them this link to set their Sub-shop admin password." : "They already have a Sub-shop admin login."
      } else {
        await removeSubShopAdmin(user.email)
        syncNote = "Their Sub-shop admin login was removed."
      }
    } catch (err) {
      syncNote = err instanceof SubShopAdminError ? `Saved here, but ${err.message}. Update their Sub-shop login by hand.` : "Saved here, but Sub-shop couldn't be updated."
    }
  } else {
    syncNote = canAccessSubShop
      ? "Saved. Create their Sub-shop admin login by hand (Sub-shop sync isn't set up yet)."
      : "Saved. Remove their Sub-shop admin login by hand (Sub-shop sync isn't set up yet)."
  }

  return NextResponse.json({ data: { canAccessSubShop, inviteUrl, syncNote } })
}
