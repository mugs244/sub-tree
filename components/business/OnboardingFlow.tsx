"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { upload } from "@vercel/blob/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Plan = "STARTUP" | "GROWTH" | "ENTERPRISE"
type Step = "account" | "verifyEmail" | "verifyPhone" | "logo" | "pay" | "done"

const PLAN_LABELS: Record<Plan, string> = { STARTUP: "Startup", GROWTH: "Growth", ENTERPRISE: "Enterprise" }
const STEP_ORDER: Step[] = ["account", "verifyEmail", "verifyPhone", "logo", "pay", "done"]

export function OnboardingFlow() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("account")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // account
  const [companyName, setCompanyName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [tin, setTin] = useState("")
  const [plan, setPlan] = useState<Plan>("STARTUP")

  // codes
  const [emailCode, setEmailCode] = useState("")
  const [phoneCode, setPhoneCode] = useState("")

  // logo
  const [logoUrl, setLogoUrl] = useState("")

  async function post(path: string, body?: unknown) {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json.message ?? "Something went wrong")
    return json.data
  }

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setBusy(false)
    }
  }

  const stepIndex = STEP_ORDER.indexOf(step)

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Create your business account</h1>
      <p className="text-sm text-muted-foreground mt-1">Advertise to Sub-tree&apos;s audience.</p>

      {/* Progress */}
      <div className="flex gap-1.5 mt-6 mb-8">
        {STEP_ORDER.slice(0, 5).map((s, i) => (
          <div key={s} className="flex-1 h-1 rounded-full" style={{ background: i <= stepIndex ? "var(--foreground)" : "var(--border)" }} />
        ))}
      </div>

      {error && <p className="text-xs text-destructive mb-4">{error}</p>}

      {step === "account" && (
        <div className="space-y-4">
          <Field label="Company name"><Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Uganda Ltd" /></Field>
          <Field label="Company email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ads@acme.co.ug" /></Field>
          <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" /></Field>
          <Field label="Company phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0700123456" /></Field>
          <Field label="TIN"><Input value={tin} onChange={(e) => setTin(e.target.value)} placeholder="Tax identification number" /></Field>
          <Field label="Plan">
            <select value={plan} onChange={(e) => setPlan(e.target.value as Plan)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              {(Object.keys(PLAN_LABELS) as Plan[]).map((p) => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
            </select>
          </Field>
          <Button
            className="w-full"
            disabled={busy}
            onClick={() => run(async () => {
              await post("/api/business/onboarding/signup", { companyName, email, password, phone: phone.replace(/\s/g, ""), tin, plan })
              setStep("verifyEmail")
            })}
          >
            {busy ? "Creating…" : "Create account"}
          </Button>
        </div>
      )}

      {step === "verifyEmail" && (
        <CodeStep
          title="Verify your email"
          hint={`Enter the 6-digit code we emailed to ${email}.`}
          code={emailCode}
          setCode={setEmailCode}
          busy={busy}
          onSubmit={() => run(async () => { await post("/api/business/onboarding/verify-email", { code: emailCode }); setStep("verifyPhone") })}
          onResend={() => run(async () => { await post("/api/business/onboarding/resend") })}
        />
      )}

      {step === "verifyPhone" && (
        <CodeStep
          title="Verify your phone"
          hint={`Enter the code we sent by SMS to ${phone}.`}
          code={phoneCode}
          setCode={setPhoneCode}
          busy={busy}
          onSubmit={() => run(async () => { await post("/api/business/onboarding/verify-phone", { code: phoneCode }); setStep("logo") })}
          onResend={() => run(async () => { await post("/api/business/onboarding/resend") })}
        />
      )}

      {step === "logo" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-medium">Upload your logo</h2>
            <p className="text-xs text-muted-foreground mt-0.5">This completes your details — your verified badge is granted right after.</p>
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="block w-full text-sm"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              void run(async () => {
                try {
                  const result = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/business/upload" })
                  setLogoUrl(result.url)
                } catch {
                  throw new Error("Upload isn't configured in this environment — paste a logo URL below instead.")
                }
              })
            }}
          />
          <Field label="…or paste a logo URL"><Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://" /></Field>
          {logoUrl && <p className="text-xs text-success">Logo ready</p>}
          <Button
            className="w-full"
            disabled={busy || !logoUrl}
            onClick={() => run(async () => { await post("/api/business/onboarding/logo", { logoUrl }); setStep("pay") })}
          >
            {busy ? "Saving…" : "Save logo & continue"}
          </Button>
        </div>
      )}

      {step === "pay" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-medium">Activate your subscription</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              You&apos;re verified. Pay your {PLAN_LABELS[plan]} plan fee to activate — or do it later from your dashboard.
            </p>
          </div>
          <Button
            className="w-full"
            disabled={busy}
            onClick={() => run(async () => {
              try {
                const data = await post("/api/business/onboarding/pay", { phone: phone.replace(/\s/g, "") })
                if (data?.redirectUrl) { window.location.href = data.redirectUrl; return }
              } catch {
                throw new Error("Payment isn't available in this environment — you can pay later from your dashboard.")
              }
            })}
          >
            {busy ? "Starting payment…" : "Pay with Pesapal"}
          </Button>
          <button className="w-full text-xs text-muted-foreground hover:text-foreground" onClick={() => setStep("done")}>
            Skip for now
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="space-y-4 text-center">
          <div className="w-14 h-14 rounded-full bg-success-bg mx-auto flex items-center justify-center text-2xl">🌿</div>
          <h2 className="text-lg font-semibold">You&apos;re all set</h2>
          <p className="text-sm text-muted-foreground">Your business account is ready. Book ad slots, post content, and grow your reach.</p>
          <Button className="w-full" onClick={() => router.push("/business/ad-slots")}>Go to dashboard</Button>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function CodeStep({
  title, hint, code, setCode, busy, onSubmit, onResend,
}: {
  title: string; hint: string; code: string; setCode: (v: string) => void; busy: boolean; onSubmit: () => void; onResend: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
      </div>
      <Input
        inputMode="numeric"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        placeholder="000000"
        className="text-center text-2xl tracking-[0.4em] font-mono"
      />
      <Button className="w-full" disabled={busy || code.length < 4} onClick={onSubmit}>
        {busy ? "Verifying…" : "Verify"}
      </Button>
      <button className="w-full text-xs text-muted-foreground hover:text-foreground" onClick={onResend} disabled={busy}>
        Resend codes
      </button>
    </div>
  )
}
