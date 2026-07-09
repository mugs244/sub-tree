"use client"

import type { SmartCardMeta } from "@/lib/services/smart-links"
import { Music, Play, Ticket, Mic, Globe } from "lucide-react"

interface Props {
  href: string
  linkId: number
  meta: SmartCardMeta
}

export function SmartLinkCard({ href, linkId, meta }: Props) {
  const trackClick = async () => {
    await fetch(`/api/links/${linkId}/click`, { method: "POST" }).catch(() => {})
  }

  // Card layout is fixed regardless of the creator's button_style choice
  // (Feature 42: "layouts are fixed", only Feature 37 theming/colors apply).
  const base = "block w-full overflow-hidden rounded-xl border border-border transition-colors hover:bg-surface"

  if (meta.platform === "spotify") {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={trackClick}
        className={base}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {meta.image_url ? (
            <img src={meta.image_url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded bg-surface flex items-center justify-center shrink-0">
              <Music className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{meta.spotify?.track_name ?? meta.title}</p>
            {meta.spotify?.artist && (
              <p className="text-xs text-muted-foreground truncate">{meta.spotify.artist}</p>
            )}
          </div>
          <span className="ml-auto shrink-0 text-[10px] font-medium text-muted-foreground">Spotify</span>
        </div>
      </a>
    )
  }

  if (meta.platform === "youtube") {
    const thumb = meta.youtube?.thumbnail ?? meta.image_url
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={trackClick}
        className={base}
      >
        {thumb && (
          <div className="relative w-full aspect-video">
            <img src={thumb} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <div className="h-10 w-10 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="h-5 w-5 text-gray-900 ml-0.5" fill="currentColor" />
              </div>
            </div>
          </div>
        )}
        <div className="px-4 py-3">
          <p className="text-sm font-medium line-clamp-2">{meta.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">YouTube</p>
        </div>
      </a>
    )
  }

  if (meta.platform === "ticket") {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={trackClick}
        className={base}
      >
        {meta.image_url && (
          <img src={meta.image_url} alt="" className="w-full h-32 object-cover" />
        )}
        <div className="px-4 py-3 flex items-start gap-3">
          <div className="shrink-0 h-8 w-8 rounded bg-surface flex items-center justify-center mt-0.5">
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{meta.ticket?.event_name ?? meta.title}</p>
            {meta.ticket?.date && (
              <p className="text-xs text-muted-foreground mt-0.5">{meta.ticket.date}</p>
            )}
            {meta.ticket?.venue && (
              <p className="text-xs text-muted-foreground">{meta.ticket.venue}</p>
            )}
            <p className="text-[11px] font-medium mt-1.5 text-foreground">Get tickets →</p>
          </div>
        </div>
      </a>
    )
  }

  if (meta.platform === "podcast") {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" onClick={trackClick}
        className={base}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          {meta.image_url ? (
            <img src={meta.image_url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />
          ) : (
            <div className="h-10 w-10 rounded bg-surface flex items-center justify-center shrink-0">
              <Mic className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{meta.title}</p>
            {meta.description && (
              <p className="text-xs text-muted-foreground truncate">{meta.description}</p>
            )}
          </div>
        </div>
      </a>
    )
  }

  // Generic OG card (tiktok, instagram, twitter, generic)
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={trackClick}
      className={base}
    >
      {meta.image_url && (
        <img src={meta.image_url} alt="" className="w-full h-36 object-cover" />
      )}
      <div className="px-4 py-3 flex items-start gap-3">
        {!meta.image_url && (
          <div className="shrink-0 h-8 w-8 rounded bg-surface flex items-center justify-center mt-0.5">
            <Globe className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium line-clamp-2">{meta.title}</p>
          {meta.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{meta.description}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">
            {meta.platform !== "generic" ? meta.platform : new URL(href).hostname.replace("www.", "")}
          </p>
        </div>
      </div>
    </a>
  )
}
