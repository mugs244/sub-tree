import { ImageResponse } from "next/og"
import { prisma } from "@/lib/db"
import { OG, OG_SIZE, OgFrame, OgLogo, fetchDrawableImage, loadOgFonts } from "@/lib/og"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const size = OG_SIZE
export const contentType = "image/png"
export const alt = "Sub-tree profile"

type Props = { params: Promise<{ username: string }> }

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s
}

// The preview card shown when someone shares sub-tree.com/<username>: who
// the creator is on the left, a few of their real links on the right.
export default async function OgImage({ params }: Props) {
  const { username } = await params

  const user = await prisma.user.findFirst({
    where: { username, deleted_at: null },
    select: {
      profile: { select: { display_name: true, bio: true, avatar_url: true } },
      links: {
        where: { is_enabled: true },
        orderBy: { position: "asc" },
        take: 3,
        select: { label: true },
      },
    },
  })

  const name = truncate(user?.profile?.display_name || username, 24)
  const bio = user?.profile?.bio ? truncate(user.profile.bio, 110) : null
  const avatar = await fetchDrawableImage(user?.profile?.avatar_url)
  const links = (user?.links ?? []).map((l) => truncate(l.label, 22))
  const firstName = truncate(name.split(" ")[0] ?? name, 14)

  return new ImageResponse(
    (
      <OgFrame>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, paddingRight: 420 }}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              width={150}
              height={150}
              style={{ borderRadius: 999, objectFit: "cover", border: `5px solid ${OG.ink}` }}
              alt=""
            />
          ) : (
            <div style={{ display: "flex", width: 150, height: 150, borderRadius: 999, background: OG.orange, border: `5px solid ${OG.ink}`, alignItems: "center", justifyContent: "center", fontSize: 72, fontWeight: 800, color: OG.ink }}>
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: 76, fontWeight: 800, letterSpacing: "-0.045em", lineHeight: 1, color: OG.ink }}>
              {name}
            </div>
            <div style={{ display: "flex", fontSize: 32, fontWeight: 600, color: OG.orangeStrong, marginTop: 10 }}>
              {`@${username}`}
            </div>
            {bio && (
              <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: OG.muted, marginTop: 18, lineHeight: 1.3 }}>
                {bio}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <OgLogo size={44} />
            <div style={{ display: "flex", fontSize: 24, fontWeight: 600, color: OG.muted }}>
              {`sub-tree.com/${username}`}
            </div>
          </div>
        </div>

        {/* Fits its contents and stays vertically centred, however many links */}
        <div style={{ position: "absolute", right: 60, top: 0, bottom: 0, width: 380, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: 30,
            background: "#ffffff",
            border: `4px solid ${OG.ink}`,
            borderRadius: 32,
            boxShadow: `0 10px 0 0 ${OG.ink}`,
          }}
        >
          {links.map((label) => (
            <div key={label} style={{ display: "flex", justifyContent: "center", padding: "18px 0", borderRadius: 18, border: "3px solid #e5e7eb", fontSize: 26, fontWeight: 600, color: OG.ink }}>
              {label}
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "center", padding: "18px 0", borderRadius: 18, background: OG.orange, border: `3px solid ${OG.ink}`, fontSize: 26, fontWeight: 800, color: OG.ink }}>
            {`Gift ${firstName}`}
          </div>
        </div>
        </div>
      </OgFrame>
    ),
    { ...size, fonts: await loadOgFonts() },
  )
}
