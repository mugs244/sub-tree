import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { DashboardLayout } from "@/components/layouts/DashboardLayout"

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: {
      username: true,
      tier: true,
      profile: { select: { id: true } },
    },
  })

  if (!user) redirect("/onboarding/username")
  if (!user.username) redirect("/onboarding/username")
  if (!user.profile) redirect("/onboarding/profile")

  return (
    <DashboardLayout username={user.username} tier={user.tier}>
      {children}
    </DashboardLayout>
  )
}
