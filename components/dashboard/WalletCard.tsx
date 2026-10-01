"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Eye, EyeOff, Share2, History, Check } from "lucide-react"
import { WithdrawButton } from "@/components/dashboard/WithdrawButton"

export interface WalletCardProps {
  username: string
  available: number
  totalReceived: number
  inTransit: number
}

const HIDE_KEY = "st_hide_balance"
const ugx = (n: number) => Math.round(n).toLocaleString("en-UG")

const PILL = "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-[#111827] px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#1f2937] dark:bg-white/10 dark:hover:bg-white/15"

// Balance card + the three actions under it (Withdraw, Share, History), in
// the style of a banking app's home screen. The eye button hides the amounts
// on this device — handy when showing your phone to someone.
export function WalletCard({ username, available, totalReceived, inTransit }: WalletCardProps) {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    try {
      // Restoring a per-device preference after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHidden(localStorage.getItem(HIDE_KEY) === "1")
    } catch {}
  }, [])

  function toggle() {
    const next = !hidden
    setHidden(next)
    try { localStorage.setItem(HIDE_KEY, next ? "1" : "0") } catch {}
  }

  const show = (n: number) => (hidden ? "••••••" : ugx(n))

  return (
    <div className="space-y-4">
      <section
        aria-label="Wallet"
        className="relative overflow-hidden rounded-[28px] bg-[#ff8a3d] p-6 text-[#111827] shadow-[0_18px_40px_-18px_rgba(249,115,22,0.7)]"
      >
        {/* Soft highlight, like light on a card */}
        <span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/25 blur-2xl" aria-hidden="true" />

        <div className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              Available balance
              <button
                type="button"
                onClick={toggle}
                aria-label={hidden ? "Show balance" : "Hide balance"}
                aria-pressed={hidden}
                className="flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-black/10"
              >
                {hidden ? <EyeOff className="h-4 w-4" strokeWidth={2} /> : <Eye className="h-4 w-4" strokeWidth={2} />}
              </button>
            </div>
            <span className="rounded-full bg-white/45 px-3 py-1 text-xs font-semibold">UGX</span>
          </div>

          <p className="mt-3 text-[40px] font-bold leading-none tracking-tight tabular-nums sm:text-5xl">
            {show(available)}
          </p>

          <div className="mt-8 flex items-end justify-between gap-3 text-xs">
            <span className="min-w-0 truncate font-medium text-[#111827]/75">sub-tree.com/{username}</span>
            <span className="shrink-0 text-right text-[#111827]/75">
              {inTransit > 0 ? "On its way " : "Received "}
              <span className="font-semibold text-[#111827]">{show(inTransit > 0 ? inTransit : totalReceived)}</span>
            </span>
          </div>
        </div>
      </section>

      <div className="flex gap-2.5">
        <WithdrawButton available={available} variant="pill" />
        <ShareButton url={`https://sub-tree.com/${username}`} />
        <Link href="/dashboard/activity?filter=withdrawals" className={PILL}>
          <History className="h-4 w-4" strokeWidth={2.25} />
          History
        </Link>
      </div>
    </div>
  )
}

function ShareButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function share() {
    // The phone's share sheet when there is one, otherwise copy the link.
    if (typeof navigator.share === "function") {
      try { await navigator.share({ title: "My Sub-tree", url }) } catch { /* cancelled */ }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  return (
    <button type="button" onClick={() => void share()} className={PILL}>
      {copied ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Share2 className="h-4 w-4" strokeWidth={2.25} />}
      {copied ? "Copied" : "Share"}
    </button>
  )
}
