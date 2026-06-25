"use client"

import { useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Logo } from "@/components/brand/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function VerifyEmailForm() {
  const router = useRouter()
  const params = useSearchParams()
  const userId = Number(params.get("userId"))
  const email = params.get("email") ?? ""

  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resent, setResent] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, code }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "Invalid code"); return }
    router.push("/onboarding/username")
  }

  async function handleResend() {
    setResent(false)
    await fetch("/api/auth/resend-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })
    setResent(true)
    setTimeout(() => setResent(false), 5000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[color:var(--bg-base)]">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo variant="icon" />
          <h1 className="text-2xl font-semibold tracking-tight">Check your email</h1>
          <p className="text-sm text-[color:var(--text-secondary)] text-center">
            We sent a 6-digit code to <strong>{email}</strong>. It expires in 15 minutes.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <Input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="000000"
            className="text-center text-2xl tracking-[0.5em] font-mono"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || code.length < 6}>
            {loading ? "Verifying…" : "Verify email"}
          </Button>
        </form>

        <p className="text-center text-sm text-[color:var(--text-secondary)]">
          Didn&apos;t get it?{" "}
          <button onClick={() => void handleResend()} className="font-medium text-[color:var(--accent)] hover:underline">
            {resent ? "Sent!" : "Resend code"}
          </button>
        </p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  )
}
