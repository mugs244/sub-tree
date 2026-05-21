export type Platform =
  | "youtube"
  | "instagram"
  | "tiktok"
  | "twitter"
  | "facebook"
  | "whatsapp"
  | "github"
  | "linkedin"
  | "substack"
  | "patreon"
  | "spotify"
  | "soundcloud"
  | "twitch"
  | "discord"
  | "pinterest"
  | "snapchat"
  | "telegram"
  | "medium"
  | "beehiiv"
  | "website"

const HOSTNAME_MAP: Array<[string | RegExp, Platform]> = [
  ["youtube.com", "youtube"],
  ["youtu.be", "youtube"],
  ["instagram.com", "instagram"],
  ["tiktok.com", "tiktok"],
  ["twitter.com", "twitter"],
  ["x.com", "twitter"],
  ["facebook.com", "facebook"],
  ["fb.com", "facebook"],
  ["fb.me", "facebook"],
  ["wa.me", "whatsapp"],
  ["whatsapp.com", "whatsapp"],
  ["github.com", "github"],
  ["linkedin.com", "linkedin"],
  [/\.substack\.com$/, "substack"],
  ["substack.com", "substack"],
  ["patreon.com", "patreon"],
  ["open.spotify.com", "spotify"],
  ["spotify.com", "spotify"],
  ["soundcloud.com", "soundcloud"],
  ["twitch.tv", "twitch"],
  ["discord.gg", "discord"],
  ["discord.com", "discord"],
  ["pinterest.com", "pinterest"],
  ["snapchat.com", "snapchat"],
  ["t.me", "telegram"],
  ["telegram.me", "telegram"],
  ["telegram.org", "telegram"],
  ["medium.com", "medium"],
  ["beehiiv.com", "beehiiv"],
]

export function detectPlatform(url: string): Platform {
  try {
    const { hostname } = new URL(url)
    const host = hostname.replace(/^www\./, "").toLowerCase()
    for (const [pattern, platform] of HOSTNAME_MAP) {
      if (typeof pattern === "string" ? host === pattern : pattern.test(host)) {
        return platform
      }
    }
  } catch {
    // invalid URL — fall through
  }
  return "website"
}
