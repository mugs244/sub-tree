import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { touchUserLastActive, backfillProfileCountry } from "@/lib/services/user-activity"
import { getCountryFromHeaders } from "@/lib/utils/geo"
import { getUnreadNotificationCount } from "@/lib/services/notification"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  await touchUserLastActive(userId)
  await backfillProfileCountry(userId, getCountryFromHeaders(await headers()))

  const [user, unreadCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        profile: { select: { id: true } },
      },
    }),
    getUnreadNotificationCount(userId),
  ])

  if (!user) redirect("/onboarding/username")
  if (!user.username) redirect("/onboarding/username")
  if (!user.profile) redirect("/onboarding/profile")

  return (
    <DashboardLayout username={user.username} unreadCount={unreadCount}>
      {children}
    </DashboardLayout>
  )
}
