"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowUpRight, ArrowLeft, Smartphone, Landmark, Mail, MessageSquare, Check, Loader2, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// The withdraw flow: load saved details → pick mobile money or bank → type
// an amount (fees shown live) → get a code by email or SMS → enter it →
// receipt (also emailed). Money only ever goes to the creator's saved,
// verified details — changing those happens in Settings.

type Step = "loading" | "method" | "amount" | "verify" | "submitting" | "done" | "error"
type Method = "MOBILE_MONEY" | "BANK"
type Channel = "email" | "sms"

interface Options {
  available: number
  creatorFeeRate: number
  processorFeeRate: number
  mobileMoney: { masked: string } | null
  bank: { bankName: string; accountName: string; maskedNumber: string } | null
  channels: { email: string | null; sms: string | null }
}

interface Receipt {
  reference: string
  amount: number
  platformFee: number
  processorFee: number
  netAmount: number
  method: Method
  destination: string
  status: string
}

const ugx = (n: number) => `UGX ${Math.round(n).toLocaleString("en-UG")}`
const pct = (r: number) => `${Math.round(r * 1000) / 10}%`

export function WithdrawButton({ available }: { available: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("loading")
  const [opts, setOpts] = useState<Options | null>(null)
  const [method, setMethod] = useState<Method | null>(null)
  const [amount, setAmount] = useState("")
  const [channel, setChannel] = useState<Channel>("email")
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<Receipt | null>(null)

  const value = Number(amount)
  const max = opts?.available ?? 0
  const amountOk = amount.trim() !== "" && Number.isInteger(value) && value > 0 && value <= max
  const platformFee = opts ? Math.round(value * opts.creatorFeeRate) : 0
  const processorFee = opts ? Math.round(value * opts.processorFeeRate) : 0
  const net = value - platformFee - processorFee

  async function start() {
    setOpen(true)
    setStep("loading")
    setError(null)
    setMethod(null)
    setAmount("")
    setCode("")
    setCodeSent(false)
    setReceipt(null)
    try {
      const res = await fetch("/api/wallet/withdraw/options")
      const json = await res.json()
      if (!res.ok) throw new Error(json.message ?? "Could not load your payout details")
      const o = json.data as Options
      setOpts(o)
      setChannel(o.channels.email ? "email" : "sms")
      // Pre-select the only available destination.
      if (o.mobileMoney && !o.bank) setMethod("MOBILE_MONEY")
      if (o.bank && !o.mobileMoney) setMethod("BANK")
      setStep("method")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your payout details")
      setStep("error")
    }
  }

  function close() {
    if (step === "submitting") return
    setOpen(false)
    if (step === "done") router.refresh()
  }

  async function sendCode() {
    setSending(true)
    setError(null)
    try {
      const res = await fetch("/api/wallet/withdraw/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, channel }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? "Could not send the code"); return }
      setCode("")
      setCodeSent(true)
    } catch {
      setError("Network error — please try again")
    } finally {
      setSending(false)
    }
  }

  async function confirm() {
    setStep("submitting")
    setError(null)
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: value, code, method }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? "Could not complete the withdrawal"); setStep("verify"); return }
      setReceipt(json.data as Receipt)
      setStep("done")
    } catch {
      setError("Network error — please try again")
      setStep("verify")
    }
  }

  const stepIndex = { method: 1, amount: 2, verify: 3 } as Record<string, number>
  const back: Partial<Record<Step, Step>> = { amount: "method", verify: "amount" }

  return (
    <>
      <button
        type="button"
        onClick={() => void start()}
        disabled={available <= 0}
        className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#ff8a3d] px-5 text-sm font-semibold text-[#111827] shadow-[0_6px_20px_rgba(255,138,61,0.35)] transition-[transform,filter] duration-150 hover:brightness-105 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
        Withdraw
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={(e) => { if (e.target === e.currentTarget) close() }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdraw-title"
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-border bg-card p-6 pb-8 text-foreground shadow-2xl sm:rounded-3xl sm:pb-6"
          >
            {/* Header: back, progress, close */}
            <div className="mb-5 flex items-center justify-between">
              {back[step] ? (
                <button type="button" onClick={() => { setError(null); setStep(back[step]!) }} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-surface hover:text-foreground">
                  <ArrowLeft className="h-5 w-5" />
                </button>
              ) : <span className="h-9 w-9" />}
              {stepIndex[step] && (
                <div className="flex gap-1.5" aria-label={`Step ${stepIndex[step]} of 3`}>
                  {[1, 2, 3].map((i) => (
                    <span key={i} className={["h-1.5 w-8 rounded-full", i <= stepIndex[step]! ? "bg-[#ff8a3d]" : "bg-surface"].join(" ")} />
                  ))}
                </div>
              )}
              <button type="button" onClick={close} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-surface hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {step === "loading" && (
              <div className="flex flex-col items-center py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#ff8a3d]" />
                <p className="mt-3 text-sm text-muted-foreground">Loading your payout details…</p>
              </div>
            )}

            {step === "error" && (
              <div className="py-8 text-center">
                <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
                <p className="mt-3 text-sm">{error}</p>
                <Button className="mt-5 h-11 rounded-2xl" onClick={() => void start()}>Try again</Button>
              </div>
            )}

            {step === "method" && opts && (
              <>
                <h2 id="withdraw-title" className="text-xl font-bold tracking-tight">Where should we send it?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Withdrawals go to the details saved in Settings.</p>
                <div className="mt-5 space-y-3">
                  <MethodCard
                    icon={Smartphone}
                    title="Mobile money"
                    selected={method === "MOBILE_MONEY"}
                    onSelect={() => setMethod("MOBILE_MONEY")}
                    detail={opts.mobileMoney ? opts.mobileMoney.masked : null}
                    note="Sent straight to your MoMo number"
                    missing="Add a mobile money number in Settings"
                  />
                  <MethodCard
                    icon={Landmark}
                    title="Bank transfer"
                    selected={method === "BANK"}
                    onSelect={() => setMethod("BANK")}
                    detail={opts.bank ? `${opts.bank.bankName} ${opts.bank.maskedNumber} · ${opts.bank.accountName}` : null}
                    note="Sent by the Sub-tree team in 1–3 business days"
                    missing="Add your bank details in Settings"
                  />
                </div>
                {!opts.mobileMoney || !opts.bank ? (
                  <Link href="/dashboard/settings#payouts" onClick={() => setOpen(false)} className="mt-3 inline-block text-xs font-medium text-[color:var(--dash-orange-text)] hover:underline">
                    Manage payout details in Settings
                  </Link>
                ) : null}
                <Button className="mt-6 h-12 w-full rounded-2xl font-semibold" disabled={!method} onClick={() => setStep("amount")}>Continue</Button>
              </>
            )}

            {step === "amount" && opts && (
              <>
                <h2 id="withdraw-title" className="text-xl font-bold tracking-tight">How much?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Available <span className="font-mono font-medium text-foreground">{ugx(opts.available)}</span>
                </p>
                <label htmlFor="withdraw-amount" className="mt-5 block text-xs text-muted-foreground">Amount (UGX)</label>
                <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 focus-within:border-[#ff8a3d]">
                  <span className="text-lg font-semibold text-muted-foreground">UGX</span>
                  <input
                    id="withdraw-amount"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    autoFocus
                    value={amount ? Number(amount).toLocaleString("en-UG") : ""}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 12))}
                    placeholder="0"
                    className="h-16 w-full bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:text-muted-foreground/50"
                  />
                </div>
                {value > max && <p className="mt-2 text-xs text-destructive">That&apos;s more than your available balance.</p>}

                <div className="mt-5 space-y-2 rounded-2xl bg-surface p-4 text-sm">
                  <Line label={`Sub-tree fee (${pct(opts.creatorFeeRate)})`} value={amountOk ? `− ${ugx(platformFee)}` : "—"} />
                  <Line label={`Transfer cost (${pct(opts.processorFeeRate)})`} value={amountOk ? `− ${ugx(processorFee)}` : "—"} />
                  <div className="flex items-center justify-between border-t border-border pt-2 font-semibold">
                    <span>You&apos;ll receive</span>
                    <span className="font-mono">{amountOk ? ugx(net) : "—"}</span>
                  </div>
                </div>
                <Button className="mt-6 h-12 w-full rounded-2xl font-semibold" disabled={!amountOk || net <= 0} onClick={() => { setError(null); setCodeSent(false); setStep("verify") }}>
                  Continue
                </Button>
              </>
            )}

            {(step === "verify" || step === "submitting") && opts && (
              <>
                <h2 id="withdraw-title" className="text-xl font-bold tracking-tight">Confirm it&apos;s you</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  We&apos;ll send a 6-digit code to approve withdrawing <span className="font-mono font-medium text-foreground">{ugx(value)}</span>.
                </p>

                {!codeSent ? (
                  <>
                    <div className="mt-5 space-y-3" role="radiogroup" aria-label="Where to send the code">
                      <ChannelCard icon={Mail} title="Email" detail={opts.channels.email} selected={channel === "email"} onSelect={() => setChannel("email")} />
                      <ChannelCard icon={MessageSquare} title="SMS" detail={opts.channels.sms} selected={channel === "sms"} onSelect={() => setChannel("sms")} unavailable="No phone number on your account" />
                    </div>
                    {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
                    <Button className="mt-6 h-12 w-full rounded-2xl font-semibold" disabled={sending || !opts.channels[channel]} onClick={() => void sendCode()}>
                      {sending ? "Sending…" : "Send code"}
                    </Button>
                  </>
                ) : (
                  <>
                    <p className="mt-5 text-sm">
                      Enter the code we sent to <span className="font-medium">{opts.channels[channel]}</span>
                    </p>
                    <Input
                      aria-label="Verification code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      autoFocus
                      className="mt-3 h-14 rounded-2xl border-border bg-surface text-center font-mono text-2xl tracking-[0.5em]"
                    />
                    {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
                    <Button className="mt-6 h-12 w-full rounded-2xl font-semibold" disabled={step === "submitting" || code.length !== 6} onClick={() => void confirm()}>
                      {step === "submitting" ? "Approving…" : "Approve withdrawal"}
                    </Button>
                    <div className="mt-3 flex justify-between text-xs">
                      <button type="button" onClick={() => { setCodeSent(false); setError(null) }} className="text-muted-foreground hover:text-foreground">
                        Send another way
                      </button>
                      <button type="button" onClick={() => void sendCode()} disabled={sending} className="text-muted-foreground hover:text-foreground disabled:opacity-50">
                        {sending ? "Resending…" : "Resend code"}
                      </button>
                    </div>
                  </>
                )}
              </>
            )}

            {step === "done" && receipt && <ReceiptView receipt={receipt} email={opts?.channels.email ?? null} onDone={close} />}
          </div>
        </div>
      )}
    </>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}

function MethodCard({
  icon: Icon, title, detail, note, missing, selected, onSelect,
}: {
  icon: React.ElementType
  title: string
  detail: string | null
  note: string
  missing: string
  selected: boolean
  onSelect: () => void
}) {
  const disabled = !detail
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={[
        "flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-left transition-colors duration-150",
        selected ? "border-[#ff8a3d] bg-[color:var(--dash-orange-soft)]" : "border-border hover:border-foreground/20",
        disabled ? "cursor-not-allowed opacity-60" : "",
      ].join(" ")}
    >
      <span className={["flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", selected ? "bg-[#ff8a3d] text-[#111827]" : "bg-surface text-muted-foreground"].join(" ")}>
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{detail ?? missing}</span>
        {detail && <span className="mt-0.5 block text-[11px] text-muted-foreground">{note}</span>}
      </span>
      <span className={["flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2", selected ? "border-[#ff8a3d] bg-[#ff8a3d]" : "border-border"].join(" ")}>
        {selected && <Check className="h-3 w-3 text-[#111827]" strokeWidth={3} />}
      </span>
    </button>
  )
}

function ChannelCard({
  icon: Icon, title, detail, selected, onSelect, unavailable = "Not available",
}: {
  icon: React.ElementType
  title: string
  detail: string | null
  selected: boolean
  onSelect: () => void
  unavailable?: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={!detail}
      onClick={onSelect}
      className={[
        "flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors duration-150",
        selected ? "border-[#ff8a3d] bg-[color:var(--dash-orange-soft)]" : "border-border hover:border-foreground/20",
        !detail ? "cursor-not-allowed opacity-60" : "",
      ].join(" ")}
    >
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={2} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{detail ?? unavailable}</span>
      </span>
      <span className={["h-5 w-5 shrink-0 rounded-full border-2", selected ? "border-[6px] border-[#ff8a3d]" : "border-border"].join(" ")} />
    </button>
  )
}

function ReceiptView({ receipt, email, onDone }: { receipt: Receipt; email: string | null; onDone: () => void }) {
  const failed = receipt.status === "FAILED"
  const next = failed
    ? "This withdrawal couldn't be sent, so the amount is back in your balance. We've sent you the reason."
    : receipt.method === "BANK"
      ? "The Sub-tree team will send this to your bank within 1–3 business days. We'll let you know when it's done."
      : receipt.status === "PROCESSING"
        ? "It's on its way to your mobile money number — usually within a few minutes."
        : "The Sub-tree team will send it to your mobile money number shortly. We'll let you know when it's done."

  return (
    <div>
      <div className="flex flex-col items-center text-center">
        <span className={["flex h-14 w-14 items-center justify-center rounded-full", failed ? "bg-error-bg text-error" : "bg-success-bg text-success"].join(" ")}>
          {failed ? <AlertTriangle className="h-7 w-7" /> : <Check className="h-7 w-7" strokeWidth={3} />}
        </span>
        <h2 id="withdraw-title" className="mt-3 text-xl font-bold tracking-tight">{failed ? "Withdrawal not sent" : "Withdrawal approved"}</h2>
        <p className="mt-1 text-xs text-muted-foreground">Reference {receipt.reference}</p>
      </div>

      <div className="mt-5 rounded-2xl bg-[#111827] p-5 text-white ring-1 ring-white/10">
        <p className="text-xs text-white/60">You receive</p>
        <p className="mt-1 font-mono text-3xl font-bold">{ugx(receipt.netAmount)}</p>
        <p className="mt-1 truncate text-xs text-white/60">to {receipt.destination}</p>
      </div>

      <div className="mt-4 space-y-2 rounded-2xl bg-surface p-4 text-sm">
        <Line label="Amount withdrawn" value={ugx(receipt.amount)} />
        <Line label="Sub-tree fee" value={`− ${ugx(receipt.platformFee)}`} />
        <Line label="Transfer cost" value={`− ${ugx(receipt.processorFee)}`} />
        <div className="flex items-center justify-between border-t border-border pt-2 font-semibold">
          <span>You receive</span>
          <span className="font-mono">{ugx(receipt.netAmount)}</span>
        </div>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{next}</p>
      {email && (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5" /> A receipt has been sent to {email}
        </p>
      )}
      <Button className="mt-6 h-12 w-full rounded-2xl font-semibold" onClick={onDone}>Done</Button>
    </div>
  )
}
