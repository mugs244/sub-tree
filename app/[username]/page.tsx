import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import { Inter, Playfair_Display, Space_Grotesk } from "next/font/google"
import { prisma } from "@/lib/db"
import { TrackedLink } from "@/components/TrackedLink"
import { PageViewTracker } from "@/components/PageViewTracker"
import { PlatformIcon } from "@/components/PlatformIcon"
import { ReferrerTracker } from "@/components/ReferrerTracker"
import { SmartLinkCard } from "@/components/SmartLinkCard"
import { DonationLaunchNotice } from "@/components/DonationLaunchNotice"
import { GiftMeSection } from "@/components/GiftMeSection"
import { detectPlatform } from "@/lib/utils/platform"
import { getDonationLaunchStatus } from "@/lib/services/donation-launch"
import { getProfileTemplate } from "@/lib/profile-templates"
import type { SmartCardMeta } from "@/lib/services/smart-links"

type Props = { params: Promise<{ username: string }> }

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"] })
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600"] })
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600"] })

// Geist Sans is already the site default (loaded once in the root layout) — no class needed for it.
const FONT_CLASS: Record<string, string> = {
  geist: "",
  inter: inter.className,
  playfair: playfair.className,
  "space-grotesk": spaceGrotesk.className,
}

const THEME_VARS: Record<string, React.CSSProperties> = {
  default: {
    "--bg-base": "#ffffff",
    "--bg-surface": "#f9fafb",
    "--text-primary": "#111827",
    "--text-muted": "#6b7280",
    "--border-default": "#e5e7eb",
    "--accent-primary": "#111827",
    "--accent-hover": "#1f2937",
  } as React.CSSProperties,
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
  const { enabled: donationsEnabled } = await getDonationLaunchStatus()

  // A template (lib/profile-templates.ts) is a whole-page design; when one is
  // chosen it drives colours and structure, and the classic theme path below
  // is skipped.
  const template = getProfileTemplate(profile.theme_preset)
  const t = template?.colors

  const buttonClass = profile.button_style === "sharp"
    ? "rounded-none"
    : profile.button_style === "pill"
      ? "rounded-full"
      : template ? "rounded-2xl" : "rounded-lg"

  const presetStyle = THEME_VARS[profile.theme_preset] ?? {}

  // CSS custom properties need a plain object with string index — cast once here
  const customOverrides: Record<string, string> = {}
  if (profile.theme_bg_color)     customOverrides["--bg-base"]        = profile.theme_bg_color
  if (profile.theme_accent_color) customOverrides["--accent-primary"] = profile.theme_accent_color
  if (profile.theme_card_bg)      customOverrides["--bg-raised"]      = profile.theme_card_bg

  // Templates still set the shared CSS variables so nested components
  // (gift-me section, smart cards) pick up matching colours.
  const templateVars: Record<string, string> = t
    ? {
        "--bg-base": t.panel,
        "--bg-surface": t.linkBg,
        "--bg-raised": t.linkBg,
        "--text-primary": t.text,
        "--text-muted": t.muted,
        "--border-default": t.border,
        "--accent-primary": t.accent,
        "--primary-foreground": t.accentText,
        "--pop-ledge": t.ledge,
      }
    : {}

  const themeStyle = (t ? templateVars : { ...presetStyle, ...customOverrides }) as React.CSSProperties

  // Derive button/card colors directly from the resolved preset + custom overrides
  // so they are never affected by Tailwind's @theme inline variable chain.
  const presetVars = presetStyle as Record<string, string>
  const donateBg   = t?.accent     ?? profile.theme_accent_color ?? presetVars["--accent-primary"] ?? "#111827"
  const donateText = t?.accentText ?? presetVars["--primary-foreground"] ?? "#ffffff"
  const buttonBg   = t?.linkBg     ?? profile.theme_button_color ?? presetVars["--bg-base"] ?? "#ffffff"
  const buttonText = t?.linkText   ?? profile.theme_button_text  ?? presetVars["--text-primary"] ?? "#111827"
  const cardBg     = t?.linkBg     ?? profile.theme_card_bg      ?? presetVars["--bg-base"] ?? "#ffffff"
  const cardText   = t?.linkText   ?? profile.theme_card_text    ?? presetVars["--text-primary"] ?? "#111827"

  // Templates are always set in Geist, like the Sub-tree site itself.
  const fontClass = template ? "" : FONT_CLASS[profile.theme_font ?? "geist"] ?? ""

  const isPro = (["PRO", "BUSINESS", "CONTENT_HOUSE"] as string[]).includes(user.tier)
  const showBranding = !isPro || !profile.hide_branding

  const linkStyle: React.CSSProperties = t
    ? { backgroundColor: buttonBg, color: buttonText, borderColor: t.border }
    : { backgroundColor: buttonBg, color: buttonText }

  return (
    <main
      style={t ? { ...themeStyle, backgroundColor: t.canvas } : themeStyle}
      className={[
        "min-h-screen flex flex-col items-center",
        template ? "justify-start px-3 py-3 sm:justify-center sm:py-12" : "bg-background justify-center px-4 py-12",
        fontClass,
      ].join(" ")}
    >
      <PageViewTracker username={username} />
      <Suspense><ReferrerTracker /></Suspense>
      <div
        style={t ? { backgroundColor: t.panel, color: t.text } : undefined}
        className={template ? "w-full max-w-md space-y-6 rounded-[28px] px-5 py-8 sm:px-8" : "w-full max-w-sm space-y-6"}
      >
        {profile.avatar_url ? (
          <div className="flex justify-center">
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              style={t ? { borderColor: t.border } : undefined}
              className={template ? "h-24 w-24 rounded-full object-cover border-[3px]" : "h-20 w-20 rounded-full object-cover border border-border"}
            />
          </div>
        ) : t && (
          <div className="flex justify-center">
            <span
              style={{ backgroundColor: t.accent, color: t.accentText, borderColor: t.border }}
              className="flex h-24 w-24 items-center justify-center rounded-full border-[3px] text-4xl font-bold"
              aria-hidden="true"
            >
              {profile.display_name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        <div className="text-center space-y-2">
          <h1 className={template ? "text-3xl font-bold tracking-tighter" : "text-xl font-semibold tracking-tight"}>
            {profile.display_name}
          </h1>
          <p
            style={t ? { color: t.handle } : undefined}
            className={template ? "text-sm font-semibold" : "text-xs text-muted-foreground font-mono"}
          >
            @{username}
          </p>
          {profile.bio && (
            <p
              style={t ? { color: t.muted } : undefined}
              className={template ? "text-sm leading-relaxed pt-1" : "text-sm text-muted-foreground leading-relaxed pt-1"}
            >
              {profile.bio}
            </p>
          )}
        </div>

        {/* Links section */}
        <div className="space-y-4">
          {links.length > 0 ? (
            <div className={template ? "space-y-3.5" : "space-y-3"}>
              {links.map((link) => {
                const showRich = link.link_type === "SMART_CARD" && !link.render_as_plain && link.smart_card_meta
                if (showRich) {
                  return (
                    <SmartLinkCard
                      key={link.id}
                      href={link.url}
                      linkId={link.id}
                      meta={link.smart_card_meta as unknown as SmartCardMeta}
                      cardBg={cardBg}
                      cardText={cardText}
                    />
                  )
                }
                return (
                  <TrackedLink
                    key={link.id}
                    href={link.url}
                    linkId={link.id}
                    style={linkStyle}
                    className={[
                      "flex items-center justify-center gap-2.5 w-full px-4 text-sm",
                      template
                        ? "pop-press py-3.5 font-semibold border-2"
                        : "py-3 font-medium border border-border transition-colors duration-150",
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
            <p style={t ? { color: t.muted } : undefined} className="text-center text-sm text-muted-foreground">No links yet.</p>
          )}
        </div>

        <div className="pt-2">
          {donationsEnabled ? (
            <a
              href={`/${username}/donate`}
              style={t ? { backgroundColor: donateBg, color: donateText, borderColor: t.ledge } : { backgroundColor: donateBg, color: donateText }}
              className={[
                "flex items-center justify-center w-full px-4 text-sm",
                template ? "pop-press py-3.5 font-bold border-2" : "py-3 font-medium transition-colors duration-150",
                buttonClass,
              ].join(" ")}
            >
              Support {profile.display_name} 💛
            </a>
          ) : (
            <>
              <div
                aria-disabled="true"
                style={t ? { backgroundColor: t.linkBg, color: t.muted, borderColor: t.border } : undefined}
                className={[
                  "flex items-center justify-center w-full px-4 py-3 text-sm font-medium cursor-not-allowed select-none",
                  template ? "border-2 border-dashed" : "bg-muted text-muted-foreground",
                  buttonClass,
                ].join(" ")}
              >
                Support {profile.display_name}
              </div>
              <div className="mt-3">
                <DonationLaunchNotice compact />
              </div>
            </>
          )}
        </div>

        {profile.gift_me_enabled && (
          <GiftMeSection displayName={profile.display_name} />
        )}

        {showBranding && (
          <p style={t ? { color: t.muted } : undefined} className="text-center text-xs text-muted-foreground pt-4">
            <Link href="/" className="hover:underline">Powered by Sub-tree</Link>
          </p>
        )}
      </div>
    </main>
  )
}
