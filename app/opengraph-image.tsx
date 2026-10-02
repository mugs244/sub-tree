import { ImageResponse } from "next/og"
import { OG, OG_SIZE, OgFrame, OgLogo, loadOgFonts } from "@/lib/og"

export const runtime = "nodejs"
export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Sub-tree — All your links, one page"

// The preview card shown when sub-tree.com (or any page without its own
// image) is shared: headline on the left, a tilted mini profile on the right.
export default async function OgImage() {
  return new ImageResponse(
    (
      <OgFrame>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <OgLogo size={50} />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 88, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 0.95, color: OG.ink }}>
              All your links.
            </div>
            <div style={{ display: "flex", fontSize: 88, fontWeight: 800, letterSpacing: "-0.05em", lineHeight: 0.95, color: OG.ink }}>
              One page.
            </div>
            <div style={{ display: "flex", width: 250, height: 12, borderRadius: 999, background: OG.orange, marginTop: 14, marginLeft: 4 }} />
            <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: OG.muted, marginTop: 22, maxWidth: 540, lineHeight: 1.3 }}>
              Share everything you create and accept mobile money donations.
            </div>
          </div>

          <div style={{ display: "flex", gap: 14 }}>
            {["MTN MoMo", "Airtel Money", "Free to sign up"].map((t, i) => (
              <div
                key={t}
                style={{
                  display: "flex",
                  padding: "12px 22px",
                  borderRadius: 999,
                  border: `3px solid ${OG.ink}`,
                  background: i === 2 ? OG.orange : "#ffffff",
                  fontSize: 24,
                  fontWeight: 600,
                  color: OG.ink,
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        <ProfileCard />
      </OgFrame>
    ),
    { ...size, fonts: await loadOgFonts() },
  )
}

function ProfileCard() {
  return (
    <div
      style={{
        position: "absolute",
        right: 70,
        top: 70,
        width: 330,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        padding: "34px 28px",
        background: "#ffffff",
        border: `4px solid ${OG.ink}`,
        borderRadius: 32,
        boxShadow: `0 10px 0 0 ${OG.ink}`,
        transform: "rotate(4deg)",
      }}
    >
      <div style={{ display: "flex", width: 96, height: 96, borderRadius: 999, background: OG.ink, color: "#ffffff", fontSize: 44, fontWeight: 800, alignItems: "center", justifyContent: "center" }}>
        A
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 800, color: OG.ink }}>Amara Naledi</div>
        <div style={{ display: "flex", fontSize: 20, fontWeight: 600, color: OG.orangeStrong }}>@amara</div>
      </div>
      {["YouTube", "Instagram", "WhatsApp"].map((l) => (
        <div key={l} style={{ display: "flex", justifyContent: "center", width: "100%", padding: "12px 0", borderRadius: 16, border: `2px solid #e5e7eb`, fontSize: 20, fontWeight: 600, color: OG.ink }}>
          {l}
        </div>
      ))}
      <div style={{ display: "flex", justifyContent: "center", width: "100%", padding: "13px 0", borderRadius: 16, background: OG.orange, border: `3px solid ${OG.ink}`, fontSize: 20, fontWeight: 800, color: OG.ink }}>
        Gift Amara
      </div>
    </div>
  )
}
