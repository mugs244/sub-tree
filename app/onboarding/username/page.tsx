import { redirect } from "next/navigation"
import { FlowShell } from "@/components/auth/FlowShell"
import { cookies } from "next/headers"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { UsernameForm } from "@/components/UsernameForm"

export default async function UsernameOnboardingPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  const cookieStore = await cookies()
  const isFan = !!cookieStore.get("fan_redirect")?.value

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, profile: { select: { id: true } } },
  })

  if (user?.username) {
    if (isFan) redirect("/onboarding/fan")
    if (!user.profile) redirect("/onboarding/profile")
    redirect("/dashboard")
  }

  const subtitle = isFan
    ? "Pick a handle for your fan profile. This will be your public Sub-tree username."
    : "This will be your public Sub-tree handle and URL. You can change it later in settings."

  return (
    <FlowShell title="Pick your username" subtitle={subtitle} step={isFan ? undefined : { current: 1, total: 3 }}>
      <UsernameForm nextPath={isFan ? "/onboarding/fan" : "/onboarding/profile"} />
    </FlowShell>
  )
}
