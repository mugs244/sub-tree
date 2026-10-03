import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { FlowShell } from "@/components/auth/FlowShell"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { ProfileForm } from "@/components/ProfileForm"

type Props = { searchParams: Promise<{ name?: string; photo?: string }> }

// Google profile photos only — anything else in ?photo= is ignored. Asks
// Google for a sharper 400px version instead of the default 96px.
function googlePhoto(url: string | undefined): string {
  if (!url) return ""
  try {
    const u = new URL(url)
    if (u.protocol !== "https:" || !u.hostname.endsWith(".googleusercontent.com")) return ""
    return u.toString().replace(/=s\d+(-c)?$/, "=s400-c")
  } catch {
    return ""
  }
}

// Profile step (photo + name). Email sign-ups reach it after picking a
// username (step 2); Google sign-ups land here first (step 1), prefilled from
// their Google account, then pick a username.
export default async function ProfileOnboardingPage({ searchParams }: Props) {
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

  // Fan sign-ups don't build a creator profile.
  const isFan = !!(await cookies()).get("fan_redirect")?.value
  if (isFan && !user?.username) redirect("/onboarding/username")

  if (user?.profile) redirect(user.username ? "/onboarding/links" : "/onboarding/username")

  const hasUsername = Boolean(user?.username)
  const sp = await searchParams

  return (
    <FlowShell
      title="Set up your profile"
      subtitle="Add a photo and your name — this is what visitors see on your Sub-tree page."
      step={{ current: hasUsername ? 2 : 1, total: 3 }}
    >
      <ProfileForm
        initialName={(sp.name ?? "").slice(0, 80)}
        initialAvatar={googlePhoto(sp.photo)}
        nextPath={hasUsername ? "/onboarding/links" : "/onboarding/username"}
      />
    </FlowShell>
  )
}
