"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CreditCard, Smartphone, Wallet, Check, Loader2, Lock, RefreshCw, ArrowLeft } from "lucide-react"

// Sub-pay: the one place money is paid to Sub-tree. Card and mobile money go
// through Pesapal's checkout, embedded below (it handles the card form and
// MoMo prompts, and offers card auto-renew); the wallet option pays from the
// creator's Sub-tree balance and can auto-renew from it.

export interface SubPayInvoice {
  number: string
  status: string
  title: string
  planLabel: string
  amount: number
  dueAt: string
  paidAt: string | null
  method: string | null
}

const ugx = (n: number) => `UGX ${Math.round(n).toLocaleString("en-UG")}`
const day = (iso: string) => new Date(iso).toLocaleDateString("en-UG", { timeZone: "Africa/Kampala", day: "numeric", month: "long", year: "numeric" })

export function SubPay({
  invoice: initial,
  walletBalance,
  autoRenewWallet: initialAuto,
  next,
}: {
  invoice: SubPayInvoice
  walletBalance: number
  autoRenewWallet: boolean
  next: { href: string; label: string }
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [invoice, setInvoice] = useState(initial)
  const [tab, setTab] = useState<"pesapal" | "wallet">(walletBalance >= initial.amount ? "wallet" : "pesapal")
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRenew, setAutoRenew] = useState(initialAuto)

  const paid = invoice.status === "PAID"
  const tracking = params.get("tracking")

  // Back from Pesapal's checkout: confirm with Pesapal, then poll briefly in
  // case the result is still settling.
  useEffect(() => {
    if (!tracking || paid) return
    let stop = false
    // A confirm-and-poll loop, kicked off by the redirect back from Pesapal.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfirming(true)
    ;(async () => {
      await fetch(`/api/pay/${invoice.number}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderTrackingId: tracking }),
      }).catch(() => {})
      for (let i = 0; i < 12 && !stop; i++) {
        const res = await fetch(`/api/pay/${invoice.number}`).catch(() => null)
        const json = res && res.ok ? await res.json() : null
        if (json?.data?.status === "PAID") {
          setInvoice((v) => ({ ...v, status: "PAID", method: json.data.method }))
          break
        }
        await new Promise((r) => setTimeout(r, 2500))
      }
      if (!stop) setConfirming(false)
    })()
    return () => { stop = true }
  }, [tracking, paid, invoice.number])

  async function openPesapal() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/pay/${invoice.number}/pesapal`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? "Couldn't open the payment window"); return }
      setIframeUrl(json.data.url)
    } catch {
      setError("Network error — please try again")
    } finally {
      setBusy(false)
    }
  }

  async function payWallet() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/pay/${invoice.number}/wallet`, { method: "POST" })
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? "Couldn't pay from your wallet"); return }
      setInvoice((v) => ({ ...v, status: "PAID", method: "WALLET" }))
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setBusy(false)
    }
  }

  async function toggleAutoRenew() {
    const nextValue = !autoRenew
    setAutoRenew(nextValue)
    const res = await fetch("/api/billing/verification/auto-renew", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: nextValue }),
    }).catch(() => null)
    if (!res || !res.ok) setAutoRenew(!nextValue)
  }

  return (
    <div className="min-h-screen bg-[#eeede8] px-3 py-6 text-[#111827] sm:py-10">
      <div className="mx-auto max-w-lg">
        <header className="mb-5 flex items-center justify-between px-1">
          <span className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/email/icon.png" alt="" className="h-9 w-9 rounded-[9px]" />
            <span className="text-xl font-extrabold tracking-tight">Sub<span className="text-[#ff8a3d]">-pay</span></span>
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-[#6b7280]"><Lock className="h-3.5 w-3.5" />Secure payment</span>
        </header>

        <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-7">
          {/* Invoice */}
          <div className="rounded-2xl bg-[#111827] p-5 text-white" style={{ borderTop: "4px solid #ff8a3d" }}>
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>{invoice.number}</span>
              <span className={["rounded-full px-2.5 py-0.5 font-semibold", paid ? "bg-[#16a34a] text-white" : "bg-white/15 text-white"].join(" ")}>
                {paid ? "Paid" : "Due " + day(invoice.dueAt)}
              </span>
            </div>
            <p className="mt-3 text-sm text-white/70">{invoice.title}</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight">{ugx(invoice.amount)}</p>
            <p className="mt-1 text-xs text-white/60">{invoice.planLabel}</p>
          </div>

          {paid ? (
            <div className="py-6 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#dcfce7] text-[#16a34a]"><Check className="h-7 w-7" strokeWidth={3} /></span>
              <h1 className="mt-3 text-xl font-bold tracking-tight">Payment received</h1>
              <p className="mt-1 text-sm text-[#6b7280]">A receipt is on its way to your email.</p>
              <Link href={next.href} className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#ff8a3d] font-semibold text-[#111827]">
                {next.label}
              </Link>
            </div>
          ) : confirming ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#ff8a3d]" />
              <p className="mt-3 text-sm font-medium">Confirming your payment…</p>
              <p className="mt-1 text-xs text-[#6b7280]">This can take a few seconds. Don&apos;t close this page.</p>
            </div>
          ) : (
            <>
              <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#f4f4f0] p-1" role="tablist">
                <TabButton active={tab === "pesapal"} onClick={() => setTab("pesapal")} icon={CreditCard} label="Card or MoMo" />
                <TabButton active={tab === "wallet"} onClick={() => setTab("wallet")} icon={Wallet} label="Wallet" />
              </div>

              {tab === "pesapal" && (
                <div className="mt-5">
                  {iframeUrl ? (
                    <>
                      <iframe
                        src={iframeUrl}
                        title="Pesapal secure checkout"
                        className="h-[620px] w-full rounded-2xl border border-[#e7e6e1]"
                        allow="payment"
                      />
                      <p className="mt-3 flex items-start gap-2 text-xs text-[#6b7280]">
                        <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        Paying by card? Turn on the recurring option in the form above to auto-renew each {invoice.planLabel.includes("year") ? "year" : "month"}.
                      </p>
                    </>
                  ) : (
                    <>
                      <ul className="space-y-2.5">
                        <Method icon={CreditCard} title="Bank card" body="Visa or Mastercard — can auto-renew" />
                        <Method icon={Smartphone} title="Mobile money" body="MTN MoMo or Airtel Money — one-time payment" />
                      </ul>
                      {error && <p className="mt-3 text-sm text-[#dc2626]">{error}</p>}
                      <button
                        type="button"
                        onClick={() => void openPesapal()}
                        disabled={busy}
                        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff8a3d] font-semibold text-[#111827] disabled:opacity-60"
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ${ugx(invoice.amount)}`}
                      </button>
                      <p className="mt-2 text-center text-[11px] text-[#9ca3af]">Processed securely by Pesapal</p>
                    </>
                  )}
                </div>
              )}

              {tab === "wallet" && (
                <div className="mt-5">
                  <div className="flex items-center justify-between rounded-2xl bg-[#f4f4f0] px-4 py-3.5">
                    <span className="text-sm text-[#6b7280]">Wallet balance</span>
                    <span className="font-semibold tabular-nums">{ugx(walletBalance)}</span>
                  </div>
                  {walletBalance < invoice.amount && (
                    <p className="mt-3 text-sm text-[#b91c1c]">Not enough in your wallet — pay by card or mobile money instead.</p>
                  )}
                  {error && <p className="mt-3 text-sm text-[#dc2626]">{error}</p>}
                  <button
                    type="button"
                    onClick={() => void payWallet()}
                    disabled={busy || walletBalance < invoice.amount}
                    className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff8a3d] font-semibold text-[#111827] disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Pay ${ugx(invoice.amount)} from wallet`}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Auto-renew from wallet — shown on every invoice */}
          <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#e7e6e1] px-4 py-3.5">
            <span>
              <span className="block text-sm font-semibold">Auto-renew from my wallet</span>
              <span className="block text-xs text-[#6b7280]">We&apos;ll pay each renewal from your Sub-tree balance when it&apos;s due.</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={autoRenew}
              onClick={() => void toggleAutoRenew()}
              className={["relative h-6 w-11 shrink-0 rounded-full transition-colors", autoRenew ? "bg-[#ff8a3d]" : "bg-[#d1d5db]"].join(" ")}
            >
              <span className={["absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform", autoRenew ? "translate-x-[22px]" : "translate-x-0.5"].join(" ")} />
            </button>
          </label>
        </div>

        <Link href="/dashboard" className="mx-auto mt-5 flex w-fit items-center gap-1.5 text-sm text-[#6b7280] hover:text-[#111827]">
          <ArrowLeft className="h-4 w-4" />Back to dashboard
        </Link>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={["flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors", active ? "bg-white shadow-sm" : "text-[#6b7280]"].join(" ")}
    >
      <Icon className="h-4 w-4" />{label}
    </button>
  )
}

function Method({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-[#f4f4f0] px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#111827] text-white"><Icon className="h-5 w-5" /></span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-[#6b7280]">{body}</span>
      </span>
    </li>
  )
}
