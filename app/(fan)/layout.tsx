import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { FanNav } from "@/components/FanNav"

export default async function FanLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
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
