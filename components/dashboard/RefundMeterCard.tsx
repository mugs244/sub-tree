import Link from "next/link"
import { Clock, IdCard, BadgeCheck, Check, X } from "lucide-react"
import { REFUND_WINDOW_DAYS, type RefundMeter } from "@/lib/services/billing"

const fmt = (n: number) => `UGX ${Math.round(n).toLocaleString("en-UG")}`
const day = (iso: string) => new Date(iso).toLocaleDateString("en-UG", { timeZone: "Africa/Kampala", day: "numeric", month: "short" })

// Shown under the verification flow for 7 days after a payment: how much of
// the refund window is left and whether the subscription has been "used".
export function RefundMeterCard({ meter }: { meter: RefundMeter }) {
  const daysLeft = meter.daysLeft
  const reason = meter.checkStarted ? "you've started the ID check" : meter.badgeShowing ? "your verified badge is showing" : null
  const subject = encodeURIComponent(`Refund request ${meter.invoiceNumber}`)

  return (
    <section className="rounded-3xl bg-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight">Refund window</h2>
          <p className="text-xs text-muted-foreground">
            {meter.invoiceNumber} · {fmt(meter.amount)} paid {day(meter.paidAt)}
          </p>
        </div>
        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
            meter.eligible ? "bg-success-bg text-success" : "bg-card text-muted-foreground",
          ].join(" ")}
        >
          {meter.eligible ? "Refundable" : "Not refundable"}
        </span>
      </div>

      {/* Time meter */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 font-medium"><Clock className="h-3.5 w-3.5" /> Time</span>
          <span className="text-muted-foreground">
            {daysLeft > 0 ? `${daysLeft} of ${REFUND_WINDOW_DAYS} days left · until ${day(meter.windowEndsAt)}` : "Window closed"}
          </span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-card" role="meter" aria-label="Refund window used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(meter.timeUsed * 100)}>
          <div className="h-full rounded-full bg-[color:var(--dash-orange,#ff8a3d)]" style={{ width: `${Math.round(meter.timeUsed * 100)}%` }} />
        </div>
      </div>

      {/* Usage meter */}
      <div className="mt-4">
        <p className="text-xs font-medium">Usage</p>
        <ul className="mt-1.5 space-y-1.5">
          <UsageRow icon={IdCard} label="ID check started" hit={meter.checkStarted} />
          <UsageRow icon={BadgeCheck} label="Verified badge showing" hit={meter.badgeShowing} />
        </ul>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        {meter.eligible ? (
          <>
            You can still get a refund until {day(meter.windowEndsAt)}, as long as you don&apos;t start the ID check.{" "}
            <a href={`mailto:admin@sub-tree.com?subject=${subject}`} className="font-semibold text-foreground underline underline-offset-4">
              Request a refund
            </a>
          </>
        ) : reason ? (
          <>This payment is no longer refundable because {reason}.</>
        ) : (
          <>The {REFUND_WINDOW_DAYS}-day refund window for this payment has closed.</>
        )}{" "}
        <Link href="/refunds" className="underline underline-offset-4">Refund policy</Link>
      </p>
    </section>
  )
}

function UsageRow({ icon: Icon, label, hit }: { icon: React.ElementType; label: string; hit: boolean }) {
  return (
    <li className="flex items-center gap-2.5 rounded-2xl bg-card px-3 py-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={2} />
      <span className="flex-1">{label}</span>
      {hit ? (
        <span className="flex items-center gap-1 text-xs font-semibold text-error"><X className="h-3.5 w-3.5" /> Used</span>
      ) : (
        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Check className="h-3.5 w-3.5" /> Not yet</span>
      )}
    </li>
  )
}
