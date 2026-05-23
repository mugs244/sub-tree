import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { DonateForm } from "@/components/DonateForm"

type Props = { params: Promise<{ username: string; id: string }> }

function formatUGX(n: bigint) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(Number(n))
}

export async function generateMetadata({ params }: Props) {
  const { username, id: raw } = await params
  const id = parseInt(raw, 10)
  if (isNaN(id)) return {}

  const f = await prisma.fundraiser.findUnique({
    where: { id },
    select: { title: true, user: { select: { username: true } } },
  })
  if (!f || f.user.username !== username) return {}
  return { title: `${f.title} — Sub-tree Fundraiser` }
}

export default async function FundraiserDonatePage({ params }: Props) {
  const { username, id: raw } = await params
  const id = parseInt(raw, 10)
  if (isNaN(id)) notFound()

  const f = await prisma.fundraiser.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      goal_amount: true,
      raised_amount: true,
      deadline: true,
      cover_image_url: true,
      show_progress: true,
      status: true,
      user: {
        select: {
          username: true,
          deleted_at: true,
          profile: { select: { display_name: true, avatar_url: true } },
        },
      },
    },
  })

  if (
    !f ||
    f.user.username !== username ||
    f.user.deleted_at ||
    f.status !== "ACTIVE"
  ) {
    notFound()
  }

  const goalNum = Number(f.goal_amount)
  const raisedNum = Number(f.raised_amount)
  const progress = goalNum > 0
    ? Math.min(100, Math.round((raisedNum / goalNum) * 100))
    : 0

  const daysLeft = f.deadline
    ? Math.ceil((f.deadline.getTime() - Date.now()) / 86_400_000)
    : null

  const displayName = f.user.profile?.display_name ?? username

  return (
    <main className="min-h-screen bg-surface flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-sm space-y-5">

        {/* Fundraiser context */}
        <div className="bg-background border border-border rounded-xl overflow-hidden">
          {f.cover_image_url && (
            <img src={f.cover_image_url} alt="" className="w-full h-32 object-cover" />
          )}
          <div className="px-4 pt-4 pb-4 space-y-3">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {displayName} is raising funds
              </p>
              <h1 className="text-base font-semibold leading-snug">{f.title}</h1>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{f.description}</p>
            </div>

            {f.show_progress && (
              <div className="space-y-1">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{formatUGX(f.raised_amount)} raised</span>
                  <span>of {formatUGX(f.goal_amount)}</span>
                </div>
                {daysLeft !== null && (
                  <p className="text-[11px] text-muted-foreground">
                    {daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining` : "Campaign ended"}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Donation form */}
        <div className="bg-background border border-border rounded-xl p-6">
          <DonateForm
            username={username}
            displayName={displayName}
            fundraiserId={f.id}
          />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <a href={`/${username}`} className="hover:underline">← Back to profile</a>
        </p>
      </div>
    </main>
  )
}
