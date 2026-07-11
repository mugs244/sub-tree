import { ImageResponse } from "next/og"

export const runtime = "nodejs"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          fontFamily: "sans-serif",
          gap: "28px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: 20,
              background: "#111827",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3 L9 7 L12 7 L15 7 L12 3 Z" fill="#ffffff" />
              <path d="M8 10 L12 6 L16 10" />
              <path d="M7 14 L12 9 L17 14" />
              <path d="M6 18 L12 12 L18 18" />
              <path d="M12 18 L12 21" strokeWidth="2" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 600, letterSpacing: "-0.02em", color: "#111827" }}>
            Sub<span style={{ color: "#6b7280" }}>-</span>tree
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#4b5563", textAlign: "center" }}>
          All your links, one page
        </div>
      </div>
    ),
    { ...size },
  )
}
