"use client"

import { useState } from "react"
import Link from "next/link"
import { IdCard, ScanFace, Mail, ShieldCheck, Loader2, Clock, AlertTriangle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VerifiedBadge } from "@/components/VerifiedBadge"
import type { VerificationState } from "@/lib/services/verification"

// Applying for the verification badge: intro → email code → Smile ID's
// hosted capture (ID front, ID back, face scan) → "being checked". The
// verdict only ever comes from Smile ID's webhook, never from this page.

type Step = "intro" | "code" | "opening" | "capturing" | "done"

interface SmileConfig {
  token: string
  partnerId: string
  sandbox: boolean
  smileUserId: string
  product: string
  script: string
  callbackUrl: string
  country: string
  idType: string
}

declare global {
  interface Window {
    SmileIdentity?: (config: Record<string, unknown>) => void
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.SmileIdentity) return resolve()
    const s = document.createElement("script")
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error("Could not load the identity check"))
    document.body.appendChild(s)
  })
}

export function VerificationFlow({ initial }: { initial: VerificationState }) {
  const [state, setState] = useState(initial)
  const [step, setStep] = useState<Step>("intro")
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendCode() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/verification/start", { method: "POST" })
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? "Could not send the code"); return }
      setStep("code")
    } catch {
      setError("Network error — please try again")
    } finally {
      setBusy(false)
    }
  }

  async function openCheck() {
    setBusy(true)
    setError(null)
    setStep("opening")
    try {
      const res = await fetch("/api/verification/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? "Could not start the identity check"); setStep("code"); return }
      const cfg = json.data as SmileConfig
      await loadScript(cfg.script)
      setStep("capturing")
      launch(cfg)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start the identity check")
      setStep("code")
    } finally {
      setBusy(false)
    }
  }

  function launch(cfg: SmileConfig) {
    const submitted = async (detail?: { job_id?: string; jobId?: string }) => {
      await fetch("/api/verification/submitted", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ smileUserId: cfg.smileUserId, jobId: detail?.job_id ?? detail?.jobId ?? null }),
      }).catch(() => {})
      setState((s) => ({ ...s, stage: "submitted" }))
      setStep("done")
    }

    // VERIFY IN SANDBOX: option names follow Smile ID's Web SDK docs; the
    // docs mention both onSuccess and onResult, so both are wired.
    window.SmileIdentity!({
      token: cfg.token,
      product: cfg.product,
      callback_url: cfg.callbackUrl,
      environment: cfg.sandbox ? "sandbox" : "live",
      partner_details: {
        partner_id: cfg.partnerId,
        name: "Sub-tree",
        logo_url: "https://sub-tree.com/email/icon.png",
        policy_url: "https://sub-tree.com/terms",
        theme_color: "#ff8a3d",
      },
      id_selection: { [cfg.country]: [cfg.idType] },
      document_capture_modes: ["camera", "upload"],
      onSuccess: submitted,
      onResult: (r: { status?: string; job_id?: string }) => { if (!r?.status || r.status === "success") void submitted(r) },
      onClose: () => setStep((s) => (s === "capturing" ? "intro" : s)),
      onError: () => { setError("The identity check stopped before finishing. You can try again."); setStep("intro") },
    })
  }

  // ── Already verified / in progress / out of tries ───────────────────────

  if (state.stage === "verified") {
    return (
      <Panel>
        <div className="flex flex-col items-center py-6 text-center">
          <VerifiedBadge size={64} />
          <h2 className="mt-4 text-2xl font-bold tracking-tight">You&apos;re verified</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Your verified badge is showing on your page{state.verifiedAt ? ` since ${new Date(state.verifiedAt).toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" })}` : ""}.
          </p>
        </div>
      </Panel>
    )
  }

  if (state.stage === "submitted" || state.stage === "in_review" || step === "done") {
    return (
      <Panel>
        <div className="flex flex-col items-center py-6 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--dash-orange-soft)] text-[color:var(--dash-orange-text)]">
            <Clock className="h-8 w-8" />
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">
            {state.stage === "in_review" ? "A person is reviewing it" : "We're checking your ID"}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {state.stage === "in_review"
              ? "Your verification needs a quick look from our team — usually within 1–2 business days."
              : "This usually takes a few minutes. We'll email you as soon as it's done — you can close this page."}
          </p>
        </div>
      </Panel>
    )
  }

  if (!state.configured) {
    return (
      <Panel>
        <div className="py-6 text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-[color:var(--dash-orange-text)]" />
          <h2 className="mt-4 text-2xl font-bold tracking-tight">Verification is coming soon</h2>
          <p className="mt-2 text-sm text-muted-foreground">We&apos;ll let you know when you can apply for your badge.</p>
        </div>
      </Panel>
    )
  }

  if (state.attemptsLeft <= 0) {
    return (
      <Panel>
        <div className="py-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-destructive" />
          <h2 className="mt-4 text-xl font-bold tracking-tight">No tries left</h2>
          <p className="mt-2 text-sm text-muted-foreground">You&apos;ve used all your verification attempts.</p>
          <Link href="/dashboard/support" className="mt-4 inline-block text-sm font-semibold text-[color:var(--dash-orange-text)] hover:underline">
            Message support
          </Link>
        </div>
      </Panel>
    )
  }

  // ── Apply ───────────────────────────────────────────────────────────────

  return (
    <Panel>
      {state.stage === "rejected" && (
        <p className="mb-5 rounded-2xl bg-error-bg px-4 py-3 text-sm text-error">
          Your last attempt wasn&apos;t approved. Check the tips below and try again.
        </p>
      )}

      {step === "intro" && (
        <>
          <div className="flex items-center gap-3">
            <VerifiedBadge size={44} />
            <div>
              <h2 className="text-xl font-bold tracking-tight">Get your verified badge</h2>
              <p className="text-sm text-muted-foreground">Show supporters a real, ID-checked person runs your page.</p>
            </div>
          </div>

          <ol className="mt-6 space-y-3">
            <Need icon={Mail} title="A code from your email" body="We'll email a code to confirm it's you." />
            <Need icon={IdCard} title="Your Ugandan national ID" body="A photo of the front and the back." />
            <Need icon={ScanFace} title="A quick face scan" body="To match you to the photo on your ID." />
          </ol>

          <div className="mt-5 rounded-2xl bg-surface p-4 text-xs leading-relaxed text-muted-foreground">
            <p className="font-semibold text-foreground">Tips</p>
            <p className="mt-1">Use your original ID (not a photocopy) in good light, with all four corners showing and no glare. For the face scan, remove glasses and hats.</p>
            <p className="mt-3 font-semibold text-foreground">Your privacy</p>
            <p className="mt-1">
              Your ID photos and face scan go straight to our verification partner, Smile ID, and Sub-tree doesn&apos;t keep copies.
              We only keep the result and the name on your ID (privately, never shown on your page).
            </p>
          </div>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
          <Button className="mt-6 h-12 w-full rounded-2xl font-semibold" disabled={busy} onClick={() => void sendCode()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start — email me a code"}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {state.attemptsLeft} {state.attemptsLeft === 1 ? "try" : "tries"} left
          </p>
        </>
      )}

      {(step === "code" || step === "opening") && (
        <>
          <h2 className="text-xl font-bold tracking-tight">Enter your code</h2>
          <p className="mt-1 text-sm text-muted-foreground">We sent a 6-digit code to your account email.</p>
          <Input
            aria-label="Verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            autoFocus
            className="mt-5 h-14 rounded-2xl border-border bg-surface text-center font-mono text-2xl tracking-[0.5em]"
          />
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <Button className="mt-6 h-12 w-full rounded-2xl font-semibold" disabled={busy || code.length !== 6} onClick={() => void openCheck()}>
            {step === "opening" ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening the ID check…</> : "Continue to ID check"}
          </Button>
          <button type="button" onClick={() => void sendCode()} disabled={busy} className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground">
            Resend code
          </button>
        </>
      )}

      {step === "capturing" && (
        <div className="flex flex-col items-center py-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff8a3d]" />
          <p className="mt-3 text-sm text-muted-foreground">Follow the steps in the ID check window…</p>
        </div>
      )}
    </Panel>
  )
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl bg-surface p-5 sm:p-7 [&_.bg-surface]:bg-card">{children}</div>
}

function Need({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#111827] text-white dark:bg-white/10">
        <Icon className="h-5 w-5" strokeWidth={2} />
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{body}</span>
      </span>
      <Check className="ml-auto h-4 w-4 text-muted-foreground/40" aria-hidden="true" />
    </li>
  )
}
