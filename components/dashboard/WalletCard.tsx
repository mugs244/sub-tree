import Link from "next/link"
import { Nfc, History } from "lucide-react"
import { WithdrawButton } from "@/components/dashboard/WithdrawButton"

export interface WalletCardProps {
  username: string
  available: number
  totalReceived: number
  inTransit: number
  creatorFeeRate: number
  processorFeeRate: number
}

function ugx(n: number): string {
  return Math.round(n).toLocaleString("en-UG")
}

// The creator's balance as a bank-card style panel, with Withdraw built in.
// Stays dark in both light and dark mode, like a physical card.
export function WalletCard({ username, available, totalReceived, inTransit, creatorFeeRate, processorFeeRate }: WalletCardProps) {
  return (
    <section
      aria-label="Wallet"
      className="relative overflow-hidden rounded-[28px] bg-[#111827] p-6 text-white shadow-[0_20px_50px_-20px_rgba(17,24,39,0.6)] ring-1 ring-white/10 sm:p-7"
    >
      {/* Orange glow */}
      <span className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[#ff8a3d] opacity-30 blur-3xl" aria-hidden="true" />
      <span className="pointer-events-none absolute -bottom-28 -left-16 h-56 w-56 rounded-full bg-[#ff8a3d] opacity-10 blur-3xl" aria-hidden="true" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold tracking-tight">Sub-tree wallet</span>
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80">UGX</span>
            <Nfc className="h-5 w-5 text-white/60" strokeWidth={1.75} aria-hidden="true" />
          </span>
        </div>

        {/* Card chip */}
        <div className="mt-6 grid h-8 w-11 grid-cols-3 gap-px overflow-hidden rounded-md bg-gradient-to-br from-[#ffc596] to-[#ff8a3d] p-1 opacity-90" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="rounded-[2px] border border-[#111827]/25" />
          ))}
        </div>

        <p className="mt-5 text-xs font-medium text-white/60">Available balance</p>
        <p className="mt-1 flex items-baseline gap-2 tabular-nums">
          <span className="text-lg font-semibold text-white/70">UGX</span>
          <span className="text-4xl font-bold tracking-tight sm:text-5xl">{ugx(available)}</span>
        </p>

        <dl className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/[0.06] px-3.5 py-2.5">
            <dt className="text-[11px] text-white/55">Total received</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">UGX {ugx(totalReceived)}</dd>
          </div>
          <div className="rounded-2xl bg-white/[0.06] px-3.5 py-2.5">
            <dt className="text-[11px] text-white/55">On its way to you</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">UGX {ugx(inTransit)}</dd>
          </div>
        </dl>

        <p className="mt-5 truncate font-mono text-xs tracking-[0.2em] text-white/40">
          •••• sub-tree.com/{username}
        </p>

        <div className="mt-5 flex gap-3">
          <WithdrawButton available={available} creatorFeeRate={creatorFeeRate} processorFeeRate={processorFeeRate} />
          <Link
            href="/dashboard/activity?filter=withdrawals"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/15"
          >
            <History className="h-4 w-4" strokeWidth={2} />
            History
          </Link>
        </div>
      </div>
    </section>
  )
}
