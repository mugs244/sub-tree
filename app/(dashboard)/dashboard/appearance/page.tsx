import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { AppearanceForm } from "@/components/AppearanceForm"

export default async function AppearancePage() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true, username: true },
  })
  if (!user) {
    redirect("/onboarding/username")
  }

  const profile = await prisma.profile.findUnique({
    where: { user_id: user.id },
    select: { theme_preset: true, button_style: true, display_name: true, avatar_url: true },
  })

  return (
    <div className="p-6 md:p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Appearance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customise how your public profile looks to visitors.
        </p>
      </div>

      <AppearanceForm
        initialTheme={profile?.theme_preset ?? "default"}
        initialButtonStyle={profile?.button_style ?? "rounded"}
        displayName={profile?.display_name ?? user.username ?? "Your Name"}
        username={user.username ?? "username"}
        avatarUrl={profile?.avatar_url ?? undefined}
      />
    </div>
  )
}
