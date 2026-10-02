import { readFile } from "node:fs/promises"
import { treeSvgDataUri } from "@/components/brand/TreeGlyph"
import { join } from "node:path"

// Shared pieces for the link-preview images (opengraph-image.tsx files), in
// the landing page's look: off-white canvas, chunky black borders, orange.
//
// Satori (the renderer behind ImageResponse) is strict: any <div> with more
// than one child node needs an explicit display: flex — including text like
// `@{username}`, which is two nodes. Build strings with template literals.

export const OG_SIZE = { width: 1200, height: 630 }

export const OG = {
  canvas: "#eeede8",
  panel: "#fafaf8",
  ink: "#111827",
  muted: "#4b5563",
  orange: "#ff9a4d",
  orangeStrong: "#f97316",
  orangeSoft: "#ffe2cc",
} as const

export async function loadOgFonts() {
  const [semibold, extrabold] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/Geist-600.ttf")),
    readFile(join(process.cwd(), "assets/fonts/Geist-800.ttf")),
  ])
  return [
    { name: "Geist", data: semibold, weight: 600 as const, style: "normal" as const },
    { name: "Geist", data: extrabold, weight: 800 as const, style: "normal" as const },
  ]
}

// Satori can't decode WebP/AVIF/GIF, and a broken or slow avatar URL would
// fail the whole image — so fetch it ourselves and hand Satori a data URI
// only when it's a PNG/JPEG that actually arrived. Anything else → null, and
// the caller draws an initial instead.
export async function fetchDrawableImage(url: string | null | undefined): Promise<string | null> {
  if (!url) return null
  // Blob storage sometimes answers the first request for a cold file with a
  // 403 and serves it fine a moment later, so allow one retry.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
      const type = res.headers.get("content-type")?.split(";")[0]?.trim()
      if (res.ok && (type === "image/png" || type === "image/jpeg")) {
        const buf = Buffer.from(await res.arrayBuffer())
        return `data:${type};base64,${buf.toString("base64")}`
      }
      if (res.status !== 403) return null
    } catch {
      return null
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  return null
}

export function OgLogo({ size = 56 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.3 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size,
          background: OG.ink,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={treeSvgDataUri("#ffffff")} width={size * 0.62} height={size * 0.62} alt="" />
      </div>
      <div style={{ display: "flex", fontSize: size * 0.62, fontWeight: 800, letterSpacing: "-0.03em", color: OG.ink }}>
        Sub-tree
      </div>
    </div>
  )
}

// The rounded off-white panel every preview sits in.
export function OgFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: OG.canvas,
        padding: 28,
        fontFamily: "Geist",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          background: OG.panel,
          borderRadius: 40,
          padding: 56,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  )
}
