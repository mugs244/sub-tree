import ogs from "open-graph-scraper"

export type SmartPlatform =
  | "spotify"
  | "youtube"
  | "tiktok"
  | "instagram"
  | "twitter"
  | "ticket"
  | "podcast"
  | "generic"

export interface SmartCardMeta {
  platform: SmartPlatform
  title: string
  description: string | null
  image_url: string | null
  spotify?: { track_name: string; artist: string }
  youtube?: { video_id: string; thumbnail: string }
  ticket?: { event_name: string; date: string | null; venue: string | null }
}

// Cache TTLs in milliseconds
const TTL: Record<SmartPlatform, number> = {
  ticket:   24 * 60 * 60 * 1000,
  spotify:   7 * 24 * 60 * 60 * 1000,
  youtube:   7 * 24 * 60 * 60 * 1000,
  tiktok:    7 * 24 * 60 * 60 * 1000,
  instagram: 7 * 24 * 60 * 60 * 1000,
  twitter:   7 * 24 * 60 * 60 * 1000,
  podcast:   7 * 24 * 60 * 60 * 1000,
  generic:   7 * 24 * 60 * 60 * 1000,
}

export function isCacheStale(platform: SmartPlatform, fetchedAt: Date | null): boolean {
  if (!fetchedAt) return true
  return Date.now() - fetchedAt.getTime() > TTL[platform]
}

export function detectSmartPlatform(url: string): SmartPlatform | null {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, "")
    const path = u.pathname

    if (host === "open.spotify.com" && path.startsWith("/track/")) return "spotify"
    if (host === "open.spotify.com" && path.startsWith("/episode/")) return "podcast"
    if ((host === "youtube.com" && u.searchParams.has("v")) || host === "youtu.be") return "youtube"
    if (host === "tiktok.com" && /\/@.+\/video\//.test(path)) return "tiktok"
    if (host === "instagram.com" && (path.startsWith("/p/") || path.startsWith("/reel/"))) return "instagram"
    if ((host === "twitter.com" || host === "x.com") && /\/[^/]+\/status\//.test(path)) return "twitter"
    if (
      (host === "quicket.co.ug" && path.startsWith("/events/")) ||
      (host === "mookh.com" && path.startsWith("/event/")) ||
      (host === "tika.app" && path.startsWith("/event/")) ||
      (host === "eventbrite.com" && path.startsWith("/e/"))
    ) return "ticket"

    return null // will attempt generic OG
  } catch {
    return null
  }
}

export async function fetchSmartCardMeta(url: string): Promise<SmartCardMeta | null> {
  const platform = detectSmartPlatform(url) ?? "generic"

  try {
    const { result, error } = await ogs({
      url,
      timeout: 3000,
      fetchOptions: { headers: { "user-agent": "Twitterbot/1.0" } },
    })

    if (error || !result.success) return null

    const title = result.ogTitle ?? result.twitterTitle ?? ""
    const description = result.ogDescription ?? result.twitterDescription ?? null
    const image_url = result.ogImage?.[0]?.url ?? result.twitterImage?.[0]?.url ?? null

    if (!title) return null

    const meta: SmartCardMeta = { platform, title, description, image_url }

    if (platform === "spotify") {
      meta.spotify = {
        track_name: result.ogTitle ?? title,
        artist: (result.ogDescription ?? "").split("·")[0]?.trim() ?? "",
      }
    } else if (platform === "youtube") {
      const videoId = extractYoutubeId(url)
      if (videoId) {
        meta.youtube = {
          video_id: videoId,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        }
      }
    } else if (platform === "ticket") {
      meta.ticket = {
        event_name: title,
        date: extractDate(result.ogDescription ?? null),
        venue: null,
      }
    }

    return meta
  } catch {
    return null
  }
}

function extractYoutubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === "youtu.be") return u.pathname.slice(1)
    return u.searchParams.get("v")
  } catch {
    return null
  }
}

function extractDate(text: string | null): string | null {
  if (!text) return null
  const match = text.match(/\d{1,2}\s+\w+\s+\d{4}|\w+\s+\d{1,2},?\s+\d{4}/)
  return match?.[0] ?? null
}
