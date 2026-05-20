import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { Link2, Heart, Eye } from "lucide-react"

export default async function DashboardHomePage() {
  const { userId } = await auth()

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId! },
    select: {
      username: true,
      profile: { select: { display_name: true, view_count: true } },
      _count: { select: { links: true, donations: true } },
    },
  })

  const displayName = user?.profile?.display_name ?? user?.username ?? "Creator"
  const username = user?.username ?? ""

  return (
    <div className="p-6 md:p-8 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {displayName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          sub-tree.com/<span className="font-mono">{username}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Link2}
          label="Links"
          value={user?._count.links ?? 0}
          href="/dashboard/links"
        />
        <StatCard
          icon={Heart}
          label="Donations"
          value={user?._count.donations ?? 0}
          href="/dashboard/donations"
        />
        <StatCard
          icon={Eye}
          label="Profile views"
          value={user?.profile?.view_count ?? 0}
          href={`/${username}`}
          external
        />
      </div>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-3">
        <h2 className="text-sm font-medium">Your public page</h2>
        <p className="text-sm text-muted-foreground">
          Share your Sub-tree link with your audience.
        </p>
        <a
          href={`/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4"
        >
          sub-tree.com/{username}
        </a>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  href,
  external,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  href: string
  external?: boolean
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex items-start gap-4 bg-surface border border-border rounded-xl p-5 hover:border-foreground/20 transition-colors duration-150"
    >
      <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-background border border-border">
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
      </span>
      <div>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </a>
  )
}
