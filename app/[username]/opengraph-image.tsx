import { ImageResponse } from "next/og"
import { prisma } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

type Props = { params: Promise<{ username: string }> }

export default async function OgImage({ params }: Props) {
  const { username } = await params

  const profile = await prisma.profile.findFirst({
    where: { user: { username, deleted_at: null } },
    select: { display_name: true, bio: true, avatar_url: true },
  })

  const displayName = profile?.display_name ?? username
  const bio = profile?.bio ?? null

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
          padding: "64px",
          gap: "24px",
        }}
      >
        {profile?.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            width={120}
            height={120}
            style={{ borderRadius: "50%", objectFit: "cover" }}
            alt=""
          />
        )}

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: 56, fontWeight: 700, color: "#111827", textAlign: "center", lineHeight: 1.1 }}>
            {displayName}
          </div>
          <div style={{ fontSize: 28, color: "#6b7280", fontFamily: "monospace" }}>
            @{username}
          </div>
          {bio && (
            <div style={{
              fontSize: 24,
              color: "#4b5563",
              textAlign: "center",
              maxWidth: 800,
              lineHeight: 1.4,
              marginTop: 8,
            }}>
              {bio.length > 120 ? bio.slice(0, 120) + "…" : bio}
            </div>
          )}
        </div>

        <div style={{
          position: "absolute",
          bottom: 40,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "#9ca3af",
          fontSize: 20,
        }}>
          sub-tree.com
        </div>
      </div>
    ),
    { ...size },
  )
}
