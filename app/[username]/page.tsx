import { Suspense } from "react"
import { notFound } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { TrackedLink } from "@/components/TrackedLink"
import { PageViewTracker } from "@/components/PageViewTracker"
import { PlatformIcon } from "@/components/PlatformIcon"
import { ReferrerTracker } from "@/components/ReferrerTracker"
import { SmartLinkCard } from "@/components/SmartLinkCard"
import { FollowButton } from "@/components/FollowButton"
import { getCreatorFollowStats } from "@/lib/services/fan"
import { detectPlatform } from "@/lib/utils/platform"
import type { SmartCardMeta } from "@/lib/services/smart-links"

type Props = { params: Promise<{ username: string }> }

const THEME_VARS: Record<string, React.CSSProperties> = {
  default: {},
  warm: {
    "--bg-base": "#fffbf5",
    "--bg-surface": "#f5ede0",
    "--text-primary": "#1c1917",
    "--text-muted": "#78716c",
    "--border-default": "#e7e5e4",
    "--accent-primary": "#92400e",
    "--accent-hover": "#78350f",
  } as React.CSSProperties,
  cool: {
    "--bg-base": "#f0f9ff",
    "--bg-surface": "#e0f2fe",
    "--text-primary": "#0c4a6e",
    "--text-muted": "#0369a1",
    "--border-default": "#bae6fd",
    "--accent-primary": "#0369a1",
    "--accent-hover": "#075985",
  } as React.CSSProperties,
  forest: {
    "--bg-base": "#f0fdf4",
    "--bg-surface": "#dcfce7",
    "--text-primary": "#14532d",
    "--text-muted": "#166534",
    "--border-default": "#bbf7d0",
    "--accent-primary": "#15803d",
    "--accent-hover": "#166534",
  } as React.CSSProperties,
  midnight: {
    "--bg-base": "#0f172a",
    "--bg-surface": "#1e293b",
    "--text-primary": "#e2e8f0",
    "--text-muted": "#94a3b8",
    "--border-default": "#334155",
    "--accent-primary": "#e2e8f0",
    "--accent-hover": "#f1f5f9",
    "--primary-foreground": "#0f172a",
  } as React.CSSProperties,
}

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  const profile = await prisma.profile.findFirst({
    where: { user: { username, deleted_at: null } },
    select: { display_name: true, bio: true },
  })
  if (!profile) return {}
  return {
    title: `${profile.display_name} (@${username}) — Sub-tree`,
    description: profile.bio ?? `${profile.display_name}'s links on Sub-tree`,
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const session = await getSession()
  const viewerUserId = session?.userId ?? null

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      deleted_at: true,
      tier: true,
      profile: {
        select: {
          display_name: true,
          bio: true,
          avatar_url: true,
          theme_preset: true,
          button_style: true,
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
      links: {
        where: { is_enabled: true },
        orderBy: { position: "asc" },
        select: { id: true, url: true, label: true, link_type: true, smart_card_meta: true, render_as_plain: true },
      },
    },
  })

  if (!user || user.deleted_at || !user.profile) notFound()

  const { profile, links } = user

  const followStats = await getCreatorFollowStats(user.id, viewerUserId)

  const buttonClass = profile.button_style === "sharp"
    ? "rounded-none"
    : profile.button_style === "pill"
      ? "rounded-full"
      : "rounded-lg"

  const presetStyle = THEME_VARS[profile.theme_preset] ?? {}

  // CSS custom properties need a plain object with string index — cast once here
  const customOverrides: Record<string, string> = {}
  if (profile.theme_bg_color)     customOverrides["--bg-base"]        = profile.theme_bg_color
  if (profile.theme_accent_color) customOverrides["--accent-primary"] = profile.theme_accent_color
  if (profile.theme_button_color) customOverrides["--bg-surface"]     = profile.theme_button_color
  if (profile.theme_card_bg)      customOverrides["--bg-raised"]      = profile.theme_card_bg

  const themeStyle = { ...presetStyle, ...customOverrides } as React.CSSProperties

  const isPro = (["PRO", "BUSINESS", "CONTENT_HOUSE"] as string[]).includes(user.tier)
  const showBranding = !isPro || !profile.hide_branding

  return (
    <main
      style={themeStyle}
      className="min-h-screen bg-background flex flex-col items-center px-4 py-12"
    >
      <PageViewTracker username={username} />
      <Suspense><ReferrerTracker /></Suspense>
      <div className="w-full max-w-sm space-y-6">
        {profile.avatar_url && (
          <div className="flex justify-center">
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="h-20 w-20 rounded-full object-cover border border-border"
            />
          </div>
        )}

        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">{profile.display_name}</h1>
          <p className="text-xs text-muted-foreground font-mono">@{username}</p>
          {profile.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed pt-1">{profile.bio}</p>
          )}
          <div className="flex justify-center pt-1">
            <FollowButton
              handle={username}
              initialIsFollowing={followStats.isFollowing}
              initialCount={followStats.followerCount}
              isLoggedIn={!!viewerUserId}
            />
          </div>
        </div>

        {/* Links section */}
        <div className="space-y-4">
          {links.length > 0 ? (
            <div className="space-y-3">
              {links.map((link) => {
                const showRich = link.link_type === "SMART_CARD" && !link.render_as_plain && link.smart_card_meta
                if (showRich) {
                  return (
                    <SmartLinkCard
                      key={link.id}
                      href={link.url}
                      linkId={link.id}
                      meta={link.smart_card_meta as unknown as SmartCardMeta}
                      buttonClass={buttonClass}
                    />
                  )
                }
                return (
                  <TrackedLink
                    key={link.id}
                    href={link.url}
                    linkId={link.id}
                    className={[
                      "flex items-center justify-center gap-2.5 w-full px-4 py-3 text-sm font-medium border border-border bg-background hover:bg-surface transition-colors duration-150",
                      buttonClass,
                    ].join(" ")}
                  >
                    <PlatformIcon platform={detectPlatform(link.url)} className="h-4 w-4 shrink-0" />
                    {link.label}
                  </TrackedLink>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">No links yet.</p>
          )}
        </div>

        <div className="pt-2">
          <a
            href={`/${username}/donate`}
            className={[
              "flex items-center justify-center w-full px-4 py-3 text-sm font-medium bg-primary text-primary-foreground hover:bg-accent-dark transition-colors duration-150",
              buttonClass,
            ].join(" ")}
          >
            Support {profile.display_name} 💛
          </a>
        </div>

        {showBranding && (
          <p className="text-center text-xs text-muted-foreground pt-4">
            <a href="/" className="hover:underline">Powered by Sub-tree</a>
          </p>
        )}
      </div>
    </main>
  )
}