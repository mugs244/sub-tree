import Link from "next/link"

interface ActiveFundraiser {
  id: number
  title: string
  description: string
  goal_amount: bigint
  raised_amount: bigint
  deadline: Date | null
  cover_image_url: string | null
  show_progress: boolean
}

function formatUGX(n: bigint) {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(Number(n))
}

function daysLeft(deadline: Date | null): number | null {
  if (!deadline) return null
  return Math.ceil((deadline.getTime() - Date.now()) / 86_400_000)
}

export function PublicFundraiserCard({
  fundraiser: f,
  username,
}: {
  fundraiser: ActiveFundraiser
  username: string
}) {
  const goalNum = Number(f.goal_amount)
  const raisedNum = Number(f.raised_amount)
  const progress = goalNum > 0
    ? Math.min(100, Math.round((raisedNum / goalNum) * 100))
    : 0
  const days = daysLeft(f.deadline)

  return (
    <div className="rounded-xl border border-border bg-background overflow-hidden">
      {f.cover_image_url && (
        <img
          src={f.cover_image_url}
          alt=""
          className="w-full h-32 object-cover"
        />
      )}

      <div className="px-4 pt-4 pb-3 space-y-3">
        <div>
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Fundraiser</p>
          <p className="text-sm font-semibold leading-snug">{f.title}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.description}</p>
        </div>

        {f.show_progress && (
          <div className="space-y-1">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{formatUGX(f.raised_amount)} raised</span>
              <span>Goal: {formatUGX(f.goal_amount)}</span>
            </div>
            {days !== null && (
              <p className="text-[11px] text-muted-foreground">
                {days > 0 ? `${days} day${days !== 1 ? "s" : ""} remaining` : "Campaign ended"}
              </p>
            )}
          </div>
        )}

        <Link
          href={`/${username}/fundraiser/${f.id}`}
          className="block w-full text-center py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          Support this cause
        </Link>
      </div>
    </div>
  )
}
