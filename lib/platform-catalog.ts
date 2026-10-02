import type { Platform } from "@/lib/utils/platform"

// The platforms in "Add link". Each one can be added by signing in to the
// platform ("connect", automatic), by typing a username / link / number
// ("manual"), or either. Connect only shows when that platform's keys are
// set (see lib/services/connect.ts); otherwise the manual way is used.
// Client-safe: no secrets, just how to turn what someone types into a link.

export type ConnectProvider = "spotify" | "youtube" | "tiktok" | "twitch" | "github"

export type ManualKind =
  | { kind: "handle"; base: string; hosts: string[]; prefix?: string } // @name → base + name
  | { kind: "url"; hosts: string[]; example: string } // paste a profile link
  | { kind: "phone" } // number → wa.me link

export interface CatalogEntry {
  id: string
  name: string
  icon: Platform
  connect?: ConnectProvider
  manual?: ManualKind
  /** Shown under the input. */
  hint?: string
}

export const CATALOG: CatalogEntry[] = [
  { id: "instagram", name: "Instagram", icon: "instagram", manual: { kind: "handle", base: "https://www.instagram.com/", hosts: ["instagram.com"] } },
  { id: "tiktok", name: "TikTok", icon: "tiktok", connect: "tiktok", manual: { kind: "handle", base: "https://www.tiktok.com/@", hosts: ["tiktok.com"] } },
  { id: "youtube", name: "YouTube", icon: "youtube", connect: "youtube", manual: { kind: "handle", base: "https://www.youtube.com/@", hosts: ["youtube.com", "youtu.be"] } },
  {
    id: "spotify", name: "Spotify", icon: "spotify", connect: "spotify",
    manual: { kind: "url", hosts: ["open.spotify.com", "spotify.com"], example: "https://open.spotify.com/artist/…" },
    hint: "Artists and podcasters: paste your artist or show link so fans land on your music.",
  },
  { id: "whatsapp", name: "WhatsApp", icon: "whatsapp", manual: { kind: "phone" }, hint: "Fans tap it to open a chat with you on WhatsApp." },
  { id: "x", name: "X", icon: "twitter", manual: { kind: "url", hosts: ["x.com", "twitter.com"], example: "https://x.com/yourname" } },
  { id: "facebook", name: "Facebook", icon: "facebook", manual: { kind: "url", hosts: ["facebook.com", "fb.com", "fb.me", "m.facebook.com"], example: "https://facebook.com/yourpage" } },
  { id: "snapchat", name: "Snapchat", icon: "snapchat", manual: { kind: "handle", base: "https://www.snapchat.com/add/", hosts: ["snapchat.com"] } },
  { id: "telegram", name: "Telegram", icon: "telegram", manual: { kind: "handle", base: "https://t.me/", hosts: ["t.me", "telegram.me"] } },
  { id: "twitch", name: "Twitch", icon: "twitch", connect: "twitch", manual: { kind: "handle", base: "https://www.twitch.tv/", hosts: ["twitch.tv"] } },
  { id: "linkedin", name: "LinkedIn", icon: "linkedin", manual: { kind: "url", hosts: ["linkedin.com"], example: "https://www.linkedin.com/in/yourname" } },
  { id: "soundcloud", name: "SoundCloud", icon: "soundcloud", manual: { kind: "handle", base: "https://soundcloud.com/", hosts: ["soundcloud.com", "on.soundcloud.com"] } },
  { id: "github", name: "GitHub", icon: "github", connect: "github", manual: { kind: "handle", base: "https://github.com/", hosts: ["github.com"] } },
  { id: "pinterest", name: "Pinterest", icon: "pinterest", manual: { kind: "handle", base: "https://www.pinterest.com/", hosts: ["pinterest.com", "pin.it"] } },
  { id: "discord", name: "Discord", icon: "discord", manual: { kind: "url", hosts: ["discord.gg", "discord.com"], example: "https://discord.gg/invite" } },
]

const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "").toLowerCase()
  } catch {
    return null
  }
}

function withScheme(v: string): string {
  return /^https?:\/\//i.test(v) ? v : `https://${v}`
}

// Ugandan numbers written locally (07…) get +256; anything else needs its
// country code. Returns digits only, as wa.me wants.
export function normalizePhone(input: string): string | null {
  let d = input.replace(/[^\d+]/g, "")
  if (d.startsWith("+")) d = d.slice(1)
  else if (d.startsWith("00")) d = d.slice(2)
  else if (/^0\d{9}$/.test(d)) d = `256${d.slice(1)}`
  return /^\d{9,15}$/.test(d) ? d : null
}

// Turns what was typed into a link, or explains what's wrong.
export function buildManualUrl(entry: CatalogEntry, input: string): { url: string } | { error: string } {
  const v = input.trim()
  const m = entry.manual
  if (!m) return { error: `${entry.name} can only be connected` }
  if (!v) return { error: m.kind === "phone" ? "Enter your WhatsApp number" : m.kind === "url" ? `Paste your ${entry.name} link` : `Enter your ${entry.name} username` }

  if (m.kind === "phone") {
    const digits = normalizePhone(v)
    return digits ? { url: `https://wa.me/${digits}` } : { error: "Enter a valid number, like 0772 123456 or +256 772 123456" }
  }

  const looksLikeUrl = /^https?:\/\//i.test(v) || /^[\w-]+(\.[\w-]+)+\//.test(v) || m.hosts.some((h) => v.toLowerCase().startsWith(h) || v.toLowerCase().startsWith(`www.${h}`))
  if (looksLikeUrl || m.kind === "url") {
    const url = withScheme(v)
    const host = hostOf(url)
    if (!host || !m.hosts.some((h) => host === h || host.endsWith(`.${h}`))) {
      return { error: m.kind === "url" ? `That doesn't look like a link to ${entry.name} — for example ${m.example}` : `That isn't a link to ${entry.name}` }
    }
    return { url }
  }

  const handle = v.replace(/^@+/, "")
  if (!/^[\w.-]{1,60}$/.test(handle)) return { error: "Usernames can only use letters, numbers, dots, dashes and underscores" }
  return { url: `${m.base}${handle}` }
}
