import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { FlowShell } from "@/components/auth/FlowShell"
import { OnboardingLinks } from "@/components/OnboardingLinks"
import { availableConnectProviders } from "@/lib/services/connect"

export default async function LinksOnboardingPage() {
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

  return (
    <FlowShell title="Add your links" subtitle="Tap a platform and type your username — or connect it. You can add more any time from your dashboard." step={{ current: 3, total: 3 }}>
      <OnboardingLinks connectProviders={availableConnectProviders()} />
    </FlowShell>
  )
}
