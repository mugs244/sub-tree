import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { touchUserLastActive } from "@/lib/services/user-activity"
import { FanNav } from "@/components/FanNav"

export default async function FanLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  await touchUserLastActive(userId)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, account_type: true, profile: { select: { display_name: true } } },
  })
  if (!user) redirect("/onboarding/username")

  const isCreator = user.account_type !== "FAN"

  return (
    <FanNav
      username={user.username}
      displayName={user.profile?.display_name ?? user.username ?? ""}
      isCreator={isCreator}
    >
      {children}
    </FanNav>
  )
}
