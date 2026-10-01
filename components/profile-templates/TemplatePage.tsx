import Link from "next/link"
import { Inter } from "next/font/google"
import { ChevronRight, Heart } from "lucide-react"
import { TrackedLink } from "@/components/TrackedLink"
import { PlatformIcon } from "@/components/PlatformIcon"
import { SmartLinkCard } from "@/components/SmartLinkCard"
import { DonationLaunchNotice } from "@/components/DonationLaunchNotice"
import { GiftMeSection } from "@/components/GiftMeSection"
import { detectPlatform } from "@/lib/utils/platform"
import type { SmartCardMeta } from "@/lib/services/smart-links"
import type { ProfileTemplate, TemplateFont } from "@/lib/profile-templates"

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"] })
const FONT_CLASS: Record<TemplateFont, string> = { geist: "", inter: inter.className }

export interface TemplatePageProps {
  template: ProfileTemplate
  username: string
  profile: {
    display_name: string
    bio: string | null
    avatar_url: string | null
    button_style: string
    gift_me_enabled: boolean
  }
  links: {
    id: number
    url: string
    label: string
    link_type: string
    smart_card_meta: unknown
    render_as_plain: boolean
  }[]
  donationsEnabled: boolean
  showBranding: boolean
  // Page-view and referrer trackers from the profile page, rendered as-is.
  trackers: React.ReactNode
}

// Renders a creator's public page with a template. The layout is chosen by
// template.layout; everything a profile can show (photo, name, bio, links,
// Support, Gift me, branding) is passed in so each layout only decides looks.
export function TemplatePage(props: TemplatePageProps) {
  const { template } = props
  const c = template.colors
  // Shared CSS variables so nested components (gift-me, smart cards) match.
  const vars = {
    "--bg-base": c.panel,
    "--bg-surface": c.linkBg,
    "--bg-raised": c.linkBg,
    "--text-primary": c.text,
    "--text-muted": c.muted,
    "--border-default": c.border,
    "--accent-primary": c.accent,
    "--primary-foreground": c.accentText,
    "--pop-ledge": c.ledge,
  } as React.CSSProperties

  return (
    <main
      style={{ ...vars, backgroundColor: c.canvas, color: c.text }}
      className={["min-h-screen flex flex-col items-center", FONT_CLASS[template.font]].join(" ")}
    >
      {props.trackers}
      {template.layout === "rows" ? <RowsLayout {...props} /> : <PopLayout {...props} />}
    </main>
  )
}

function radiusFor(buttonStyle: string, rounded: string): string {
  if (buttonStyle === "sharp") return "rounded-none"
  if (buttonStyle === "pill") return "rounded-full"
  return rounded
}

function initialOf(name: string): string {
  return name.charAt(0).toUpperCase()
}

function Branding({ show, color }: { show: boolean; color: string }) {
  if (!show) return null
  return (
    <p style={{ color }} className="text-center text-xs pt-4">
      <Link href="/" className="hover:underline">Powered by Sub-tree</Link>
    </p>
  )
}

// ── "pop": Sub-tree landing style ─────────────────────────────────────────
function PopLayout({ template, username, profile, links, donationsEnabled, showBranding }: TemplatePageProps) {
  const c = template.colors
  const radius = radiusFor(profile.button_style, "rounded-2xl")

  return (
    <div className="flex w-full justify-center px-3 py-3 sm:min-h-screen sm:items-center sm:py-12">
      <div style={{ backgroundColor: c.panel }} className="w-full max-w-md space-y-6 rounded-[28px] px-5 py-8 sm:px-8">
        <div className="flex justify-center">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              style={{ borderColor: c.border }}
              className="h-24 w-24 rounded-full object-cover border-[3px]"
            />
          ) : (
            <span
              style={{ backgroundColor: c.accent, color: c.accentText, borderColor: c.border }}
              className="flex h-24 w-24 items-center justify-center rounded-full border-[3px] text-4xl font-bold"
              aria-hidden="true"
            >
              {initialOf(profile.display_name)}
            </span>
          )}
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tighter">{profile.display_name}</h1>
          <p style={{ color: c.handle }} className="text-sm font-semibold">@{username}</p>
          {profile.bio && <p style={{ color: c.muted }} className="text-sm leading-relaxed pt-1">{profile.bio}</p>}
        </div>

        {links.length > 0 ? (
          <div className="space-y-3.5">
            {links.map((link) => {
              if (link.link_type === "SMART_CARD" && !link.render_as_plain && link.smart_card_meta) {
                return (
                  <SmartLinkCard
                    key={link.id}
                    href={link.url}
                    linkId={link.id}
                    meta={link.smart_card_meta as SmartCardMeta}
                    cardBg={c.linkBg}
                    cardText={c.linkText}
                  />
                )
              }
              return (
                <TrackedLink
                  key={link.id}
                  href={link.url}
                  linkId={link.id}
                  style={{ backgroundColor: c.linkBg, color: c.linkText, borderColor: c.border }}
                  className={["pop-press flex w-full items-center justify-center gap-2.5 border-2 px-4 py-3.5 text-sm font-semibold", radius].join(" ")}
                >
                  <PlatformIcon platform={detectPlatform(link.url)} className="h-4 w-4 shrink-0" />
                  {link.label}
                </TrackedLink>
              )
            })}
          </div>
        ) : (
          <p style={{ color: c.muted }} className="text-center text-sm">No links yet.</p>
        )}

        <div className="pt-2">
          {donationsEnabled ? (
            <a
              href={`/${username}/donate`}
              style={{ backgroundColor: c.accent, color: c.accentText, borderColor: c.ledge }}
              className={["pop-press flex w-full items-center justify-center border-2 px-4 py-3.5 text-sm font-bold", radius].join(" ")}
            >
              Support {profile.display_name} 💛
            </a>
          ) : (
            <>
              <div
                aria-disabled="true"
                style={{ backgroundColor: c.linkBg, color: c.muted, borderColor: c.border }}
                className={["flex w-full cursor-not-allowed select-none items-center justify-center border-2 border-dashed px-4 py-3 text-sm font-medium", radius].join(" ")}
              >
                Support {profile.display_name}
              </div>
              <div className="mt-3">
                <DonationLaunchNotice compact />
              </div>
            </>
          )}
        </div>

        {profile.gift_me_enabled && <GiftMeSection displayName={profile.display_name} />}
        <Branding show={showBranding} color={c.muted} />
      </div>
    </div>
  )
}

// ── "rows": solid colour rows with icon, title, subtitle and chevron ───────
function linkSubtitle(url: string): string {
  try {
    const u = new URL(url)
    const path = u.pathname.replace(/\/$/, "")
    const s = `${u.hostname.replace(/^www\./, "")}${path}`
    return s.length > 42 ? `${s.slice(0, 41)}…` : s
  } catch {
    return url
  }
}

function RowsLayout({ template, username, profile, links, donationsEnabled, showBranding }: TemplatePageProps) {
  const c = template.colors
  const radius = radiusFor(profile.button_style, "rounded-xl")
  const rowClass = ["flex w-full items-center gap-4 px-5 py-3.5 text-left shadow-[0_2px_6px_rgba(17,24,39,0.08)] transition-[filter,transform] duration-150 hover:brightness-105 active:scale-[0.99]", radius].join(" ")

  return (
    <div className="flex w-full max-w-md flex-col items-center px-4 pb-10 pt-12">
      <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white p-1.5 shadow-[0_10px_30px_rgba(17,24,39,0.10)]">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.display_name} className="h-full w-full rounded-full object-cover" />
        ) : (
          <span style={{ color: c.accent }} className="text-5xl font-bold" aria-hidden="true">
            {initialOf(profile.display_name)}
          </span>
        )}
      </div>

      <h1 className="mt-5 text-center text-[26px] font-semibold tracking-tight">{profile.display_name}</h1>
      <p style={{ color: c.handle }} className="mt-0.5 text-sm font-medium">@{username}</p>
      {profile.bio && (
        <p style={{ color: c.muted }} className="mt-2 max-w-xs text-center text-[15px] leading-snug">{profile.bio}</p>
      )}

      <div className="mt-8 w-full space-y-3">
        {links.length > 0 ? (
          links.map((link) => (
            <TrackedLink
              key={link.id}
              href={link.url}
              linkId={link.id}
              style={{ backgroundColor: c.linkBg, color: c.linkText }}
              className={rowClass}
            >
              <PlatformIcon platform={detectPlatform(link.url)} className="h-6 w-6 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-semibold leading-tight">{link.label}</span>
                <span className="block truncate text-[13px] opacity-90">{linkSubtitle(link.url)}</span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0" strokeWidth={2.5} />
            </TrackedLink>
          ))
        ) : (
          <p style={{ color: c.muted }} className="text-center text-sm">No links yet.</p>
        )}

        {donationsEnabled ? (
          <a href={`/${username}/donate`} style={{ backgroundColor: c.accent, color: c.accentText }} className={rowClass}>
            <Heart className="h-6 w-6 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[17px] font-semibold leading-tight">Support {profile.display_name}</span>
              <span className="block truncate text-[13px] opacity-90">Send a gift with mobile money</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          </a>
        ) : (
          <>
            <div
              aria-disabled="true"
              className={["flex w-full cursor-not-allowed select-none items-center gap-4 bg-gray-200 px-5 py-3.5 text-gray-500", radius].join(" ")}
            >
              <Heart className="h-6 w-6 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-semibold leading-tight">Support {profile.display_name}</span>
                <span className="block truncate text-[13px]">Mobile money donations open soon</span>
              </span>
            </div>
            <DonationLaunchNotice compact />
          </>
        )}
      </div>

      {profile.gift_me_enabled && (
        <div className="mt-6 w-full">
          <GiftMeSection displayName={profile.display_name} />
        </div>
      )}

      <p style={{ color: c.muted }} className="mt-10 text-center text-xs">
        &copy; {new Date().getFullYear()} {profile.display_name}
      </p>
      <Branding show={showBranding} color={c.muted} />
    </div>
  )
}
