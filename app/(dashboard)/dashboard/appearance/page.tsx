import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { AppearanceForm } from "@/components/AppearanceForm"

const PRO_TIERS = ["PRO", "BUSINESS", "CONTENT_HOUSE"]

export default async function AppearancePage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: {
      id: true,
      username: true,
      tier: true,
      profile: {
        select: {
          theme_preset: true,
          button_style: true,
          display_name: true,
          avatar_url: true,
          bio: true,
          theme_bg_color: true,
          theme_accent_color: true,
          theme_button_color: true,
          theme_button_text: true,
          theme_card_bg: true,
          theme_card_text: true,
          theme_font: true,
          hide_branding: true,
        },
      },
    },
  })
  if (!user) redirect("/onboarding/username")

  const isPro = PRO_TIERS.includes(user.tier)

  return (
    <div className="px-4 py-5 md:p-8 max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Appearance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customise how your public profile looks to visitors.
        </p>
      </div>

      <AppearanceForm
        initialTheme={user.profile?.theme_preset ?? "default"}
        initialButtonStyle={user.profile?.button_style ?? "rounded"}
        isPro={isPro}
        proTheme={{
          theme_bg_color:     user.profile?.theme_bg_color     ?? null,
          theme_accent_color: user.profile?.theme_accent_color ?? null,
          theme_button_color: user.profile?.theme_button_color ?? null,
          theme_button_text:  user.profile?.theme_button_text  ?? null,
          theme_card_bg:      user.profile?.theme_card_bg      ?? null,
          theme_card_text:    user.profile?.theme_card_text    ?? null,
          theme_font:         user.profile?.theme_font         ?? null,
          hide_branding:      user.profile?.hide_branding      ?? false,
        }}
        displayName={user.profile?.display_name ?? user.username ?? "Your Name"}
        username={user.username ?? "username"}
        avatarUrl={user.profile?.avatar_url ?? undefined}
        bio={user.profile?.bio ?? undefined}
      />
    </div>
  )
}
