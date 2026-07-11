import { ImageResponse } from "next/og"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#111827",
          borderRadius: 7,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3 L9 7 L12 7 L15 7 L12 3 Z" fill="#ffffff" />
          <path d="M8 10 L12 6 L16 10" />
          <path d="M7 14 L12 9 L17 14" />
          <path d="M6 18 L12 12 L18 18" />
          <path d="M12 18 L12 21" strokeWidth="2.25" />
        </svg>
      </div>
    ),
    { ...size },
  )
}
