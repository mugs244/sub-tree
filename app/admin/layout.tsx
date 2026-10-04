import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { isAdmin, isSuperAdmin, canAccessSubShopAdmin, subShopAdminUrl } from "@/lib/services/admin"
import { prisma } from "@/lib/db"
import { AdminLayout } from "@/components/layouts/AdminLayout"

export default async function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session || !isAdmin(session.userId)) redirect("/")

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true },
  })

  const subShopUrl = (await canAccessSubShopAdmin(session.userId)) ? subShopAdminUrl() : null

  return (
    <AdminLayout adminEmail={user?.email ?? "admin"} superAdmin={isSuperAdmin(session.userId)} subShopUrl={subShopUrl}>
      {children}
    </AdminLayout>
  )
}
