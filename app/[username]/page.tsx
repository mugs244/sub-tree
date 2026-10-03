import { Suspense } from "react"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { PageViewTracker } from "@/components/PageViewTracker"
import { ReferrerTracker } from "@/components/ReferrerTracker"
import { getDonationLaunchStatusForViewer } from "@/lib/services/donation-launch"
import { resolveDesign } from "@/lib/profile-templates"
import { TemplatePage } from "@/components/profile-templates/TemplatePage"
import { isBadgeStyle } from "@/components/VerifiedBadge"
import { isBadgeLive } from "@/lib/services/billing"

type Props = { params: Promise<{ username: string }> }

// Reads the admin-toggleable donations_enabled flag (in addition to links,
// which already need to stay fresh) — must not be cached after first render.
export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  const profile = await prisma.profile.findFirst({
    where: { user: { username, deleted_at: null } },
    select: { display_name: true, bio: true },
  })
  if (!profile) return {}
  const title = `${profile.display_name} (@${username}) — Sub-tree`
  const description = profile.bio || `${profile.display_name}'s links on Sub-tree`
  return {
    title,
    description,
    // The preview image comes from ./opengraph-image.tsx automatically.
    openGraph: { title, description, url: `/${username}`, type: "profile", siteName: "Sub-tree", username },
    twitter: { card: "summary_large_image", title, description },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      deleted_at: true,
      verified_at: true,
      badge_style: true,
      verification_subscription: { select: { current_period_end: true } },
      tier: true,
      profile: {
        select: {
          display_name: true,
          bio: true,
          avatar_url: true,
          theme_preset: true,
          page_template: true,
          button_style: true,
          theme_bg_color: true,
          theme_accent_color: true,
          theme_button_color: true,
          theme_button_text: true,
          theme_card_bg: true,
          theme_card_text: true,
          theme_font: true,
          hide_branding: true,
          gift_me_enabled: true,
        },
      },
      links: {
        where: { is_enabled: true },
        orderBy: { position: "asc" },
        select: { id: true, url: true, label: true, link_type: true, smart_card_meta: true, render_as_plain: true },
      },
    },
  })

  if (!user || user.deleted_at || !user.profile) notFound()

  const { profile, links } = user
  // Verified and the subscription is paid (or within its grace period).
  const badgeLive = isBadgeLive(user.verified_at, user.verification_subscription)
  const badgeStyle = isBadgeStyle(user.badge_style) ? user.badge_style : "classic"
  const { enabled: donationsEnabled } = await getDonationLaunchStatusForViewer()

  const isPro = (["PRO", "BUSINESS", "CONTENT_HOUSE"] as string[]).includes(user.tier)
  const showBranding = !isPro || !profile.hide_branding

  // Template (layout) + theme (colours), chosen separately — see
  // lib/profile-templates.ts. Unchosen pages get Bold + Orange.
  return (
    <TemplatePage
      template={resolveDesign(profile.page_template, profile.theme_preset)}
      username={username}
      profile={profile}
      links={links}
      donationsEnabled={donationsEnabled}
      showBranding={showBranding}
      verified={badgeLive}
      badgeStyle={badgeStyle}
      trackers={<><PageViewTracker username={username} /><Suspense><ReferrerTracker /></Suspense></>}
    />
  )
}
