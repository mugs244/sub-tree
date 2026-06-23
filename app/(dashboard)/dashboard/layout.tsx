import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { touchUserLastActive } from "@/lib/services/user-activity"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  await touchUserLastActive(userId)

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: {
      username: true,
      profile: { select: { id: true } },
    },
  })

  if (!user) redirect("/onboarding/username")
  if (!user.username) redirect("/onboarding/username")
  if (!user.profile) redirect("/onboarding/profile")

  return (
    <DashboardLayout username={user.username}>
      {children}
    </DashboardLayout>
  )
}
