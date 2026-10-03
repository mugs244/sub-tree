import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { AppearanceForm } from "@/components/AppearanceForm"

export default async function AppearancePage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      profile: {
        select: {
          theme_preset: true,
          page_template: true,
          button_style: true,
          display_name: true,
          avatar_url: true,
          bio: true,
        },
      },
    },
  })
  if (!user) redirect("/onboarding/username")

  return (
    <div className="px-4 py-5 md:p-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Appearance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pick a template for your page&apos;s layout and a theme for its colours.
        </p>
      </div>

      <AppearanceForm
        initialTemplate={user.profile?.page_template ?? null}
        initialTheme={user.profile?.theme_preset ?? "orange"}
        initialButtonStyle={user.profile?.button_style ?? "rounded"}
        displayName={user.profile?.display_name ?? user.username ?? "Your Name"}
        username={user.username ?? "username"}
        avatarUrl={user.profile?.avatar_url ?? undefined}
        bio={user.profile?.bio ?? undefined}
      />
    </div>
  )
}
