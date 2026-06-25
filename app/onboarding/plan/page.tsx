import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export default async function PlanOnboardingPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      profile: { select: { id: true } },
    },
  })

  if (!user?.username) redirect("/onboarding/username")
  if (!user.profile) redirect("/onboarding/profile")

  redirect("/dashboard")
}
