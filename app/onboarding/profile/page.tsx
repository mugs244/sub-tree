import { redirect } from "next/navigation"
import { FlowShell } from "@/components/auth/FlowShell"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { ProfileForm } from "@/components/ProfileForm"

export default async function ProfileOnboardingPage() {
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
  if (user.profile) redirect("/onboarding/links")

  return (
    <FlowShell title="Set up your profile" subtitle="Add a photo and your name — this is what visitors see on your Sub-tree page." step={{ current: 2, total: 3 }}>
      <ProfileForm />
    </FlowShell>
  )
}
