import Link from "next/link"
import { ChevronRight, Heart, ArrowUpRight, Palette } from "lucide-react"
import { DonationLaunchNotice } from "@/components/DonationLaunchNotice"
import { WalletCard } from "@/components/dashboard/WalletCard"

export interface RecentTransaction {
  key: string
  kind: "donation" | "withdrawal"
  title: string
  at: Date
  amount: number // positive in, negative out
  status?: string
}

export interface DashboardHomeData {
  displayName: string
  username: string
  wallet: { available: number; totalReceived: number; inTransit: number }
  recent: RecentTransaction[]
}

const TZ = "Africa/Kampala"

function greeting(): string {
  const hour = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: TZ }))
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function when(d: Date): string {
  const key = (x: Date) => x.toLocaleDateString("en-CA", { timeZone: TZ })
  const now = new Date()
  const time = d.toLocaleTimeString("en-UG", { timeZone: TZ, hour: "numeric", minute: "2-digit" })
  if (key(d) === key(now)) return `Today, ${time}`
  if (key(d) === key(new Date(now.getTime() - 86_400_000))) return `Yesterday, ${time}`
  return d.toLocaleDateString("en-UG", { timeZone: TZ, day: "numeric", month: "short", year: "numeric" })
}

const STATUS_LABEL: Record<string, string> = { PENDING: "Pending", PROCESSING: "On its way", FAILED: "Failed" }

// The creator dashboard's home screen, laid out like a banking app: balance
// card and actions, one banner, then recent transactions. Insights (views,
// link taps, breakdowns) live under Activity → Insights.
export function DashboardHome({ data }: { data: DashboardHomeData }) {
  const { displayName, username, wallet, recent } = data

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 pb-6 pt-2 md:px-8 md:py-8">
      {/* Phones show the greeting in the top bar instead. */}
      <header className="hidden md:block">
        <p className="text-sm text-muted-foreground">Hi, {displayName.split(" ")[0]}</p>
        <h1 className="text-3xl font-bold tracking-tight">{greeting()}</h1>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <WalletCard username={username} {...wallet} />

          <Link
            href="/dashboard/appearance"
            className="flex items-center gap-4 rounded-3xl bg-[#111827] p-5 text-white transition-colors duration-150 hover:bg-[#1f2937] dark:bg-card dark:ring-1 dark:ring-border"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#ff8a3d] text-[#111827]">
              <Palette className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">Try a new template</span>
              <span className="block text-xs text-white/65 dark:text-muted-foreground">Give your page a fresh look in one tap</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          </Link>

          <DonationLaunchNotice inline />
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="text-lg font-bold tracking-tight">Transactions</h2>
            <Link href="/dashboard/activity" className="text-sm font-semibold text-[color:var(--dash-orange-text)] hover:underline">
              See all
            </Link>
          </div>
          {recent.length === 0 ? (
            <div className="rounded-3xl bg-surface px-6 py-12 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#111827] text-white dark:bg-white/10">
                <Heart className="h-5 w-5" strokeWidth={2} />
              </span>
              <p className="mt-3 text-sm font-semibold">No transactions yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Donations and withdrawals will show up here.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {recent.map((t) => (
                <li key={t.key} className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3.5">
                  <span
                    className={[
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                      t.kind === "donation" ? "bg-[#ff8a3d] text-[#111827]" : "bg-[#111827] text-white dark:bg-white/10",
                    ].join(" ")}
                  >
                    {t.kind === "donation" ? <Heart className="h-5 w-5" strokeWidth={2.25} /> : <ArrowUpRight className="h-5 w-5" strokeWidth={2.25} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold">{t.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {when(t.at)}{t.status && STATUS_LABEL[t.status] ? ` · ${STATUS_LABEL[t.status]}` : ""}
                    </span>
                  </span>
                  <span className={["shrink-0 font-semibold tabular-nums", t.amount > 0 ? "text-[color:var(--dash-orange-text)]" : ""].join(" ")}>
                    {t.amount > 0 ? "+" : "−"}{Math.abs(t.amount).toLocaleString("en-UG")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
