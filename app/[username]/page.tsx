import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { TrackedLink } from "@/components/TrackedLink"

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  const profile = await prisma.profile.findFirst({
    where: { user: { username, deleted_at: null } },
    select: { display_name: true, bio: true },
  })
  if (!profile) return {}
  return {
    title: `${profile.display_name} (@${username}) — Sub-tree`,
    description: profile.bio ?? `${profile.display_name}'s links on Sub-tree`,
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      deleted_at: true,
      profile: {
        select: {
          display_name: true,
          bio: true,
          avatar_url: true,
          theme_preset: true,
          button_style: true,
        },
      },
      links: {
        where: { is_enabled: true },
        orderBy: { position: "asc" },
        select: { id: true, url: true, label: true },
      },
    },
  })

  if (!user || user.deleted_at || !user.profile) notFound()

  const { profile, links } = user
  const buttonClass = profile.button_style === "sharp"
    ? "rounded-none"
    : profile.button_style === "pill"
      ? "rounded-full"
      : "rounded-lg"

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        {/* Avatar */}
        {profile.avatar_url && (
          <div className="flex justify-center">
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="h-20 w-20 rounded-full object-cover border border-border"
            />
          </div>
        )}

        {/* Identity */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">{profile.display_name}</h1>
          <p className="text-xs text-muted-foreground font-mono">@{username}</p>
          {profile.bio && (
            <p className="text-sm text-muted-foreground leading-relaxed pt-1">{profile.bio}</p>
          )}
        </div>

        {/* Links */}
        {links.length > 0 ? (
          <div className="space-y-3">
            {links.map((link) => (
              <TrackedLink
                key={link.id}
                href={link.url}
                linkId={link.id}
                className={[
                  "flex items-center justify-center w-full px-4 py-3 text-sm font-medium border border-border bg-background hover:bg-surface transition-colors duration-150",
                  buttonClass,
                ].join(" ")}
              >
                {link.label}
              </TrackedLink>
            ))}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">No links yet.</p>
        )}

        {/* Donate button */}
        <div className="pt-2">
          <a
            href={`/${username}/donate`}
            className={[
              "flex items-center justify-center w-full px-4 py-3 text-sm font-medium bg-primary text-primary-foreground hover:bg-accent-dark transition-colors duration-150",
              buttonClass,
            ].join(" ")}
          >
            Support {profile.display_name} 💛
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          <a href="/" className="hover:underline">Powered by Sub-tree</a>
        </p>
      </div>
    </main>
  )
}
