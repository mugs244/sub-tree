import { notFound, redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { DonateForm } from "@/components/DonateForm"
import { getDonationLaunchStatus } from "@/lib/services/donation-launch"

type Props = { params: Promise<{ username: string }> }

// Reads the admin-toggleable donations_enabled flag — must not be cached
// after first render.
export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  const profile = await prisma.profile.findFirst({
    where: { user: { username, deleted_at: null } },
    select: { display_name: true },
  })
  if (!profile) return {}
  return { title: `Support ${profile.display_name} — Sub-tree` }
}

export default async function DonatePage({ params }: Props) {
  const { username } = await params

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      deleted_at: true,
      profile: { select: { display_name: true, avatar_url: true } },
    },
  })

  if (!user || user.deleted_at || !user.profile) notFound()

  const { enabled: donationsEnabled } = await getDonationLaunchStatus()
  if (!donationsEnabled) redirect(`/${username}`)

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          {user.profile.avatar_url && (
            <img
              src={user.profile.avatar_url}
              alt={user.profile.display_name}
              className="h-16 w-16 rounded-full object-cover border border-border mx-auto mb-3"
            />
          )}
          <h1 className="text-xl font-semibold tracking-tight">
            Support {user.profile.display_name}
          </h1>
          <p className="text-sm text-muted-foreground">@{username}</p>
        </div>

        <div className="bg-background border border-border rounded-xl p-6">
          <DonateForm username={username} displayName={user.profile.display_name} />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <a href={`/${username}`} className="hover:underline">← Back to profile</a>
        </p>
      </div>
    </main>
  )
}
