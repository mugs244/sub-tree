"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/brand/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"

function SignInForm() {
  const router = useRouter()
  const params = useSearchParams()
  const explicitNext = params.get("next")

  const [mode, setMode] = useState<"password" | "otp-send" | "otp-verify">("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [otpUserId, setOtpUserId] = useState<number | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/auth/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      if (data.unverified) {
        router.push(`/verify-email?userId=${data.userId}&email=${encodeURIComponent(email)}`)
        return
      }
      setError(data.error ?? "Something went wrong")
      return
    }
    router.push(explicitNext ?? (data.isAdmin ? "/admin" : "/dashboard"))
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/auth/signin-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "Something went wrong"); return }
    setOtpUserId(data.userId)
    setMode("otp-verify")
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/auth/verify-signin-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: otpUserId, code }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "Invalid code"); return }
    router.push(explicitNext ?? (data.isAdmin ? "/admin" : "/dashboard"))
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[color:var(--bg-base)]">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo variant="icon" />
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to Sub-tree</h1>
        </div>

        {mode === "password" && (
          <form onSubmit={(e) => void handlePasswordSignIn(e)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-[color:var(--accent-primary)] hover:underline">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput id="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
            <button
              type="button"
              onClick={() => { setError(""); setMode("otp-send") }}
              className="w-full text-sm text-center text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
            >
              Sign in with a code instead
            </button>
          </form>
        )}

        {mode === "otp-send" && (
          <form onSubmit={(e) => void handleSendCode(e)} className="space-y-4">
            <p className="text-sm text-[color:var(--text-secondary)] text-center">
              We&apos;ll email you a 6-digit code to sign in.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="otp-email">Email</Label>
              <Input id="otp-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send code"}
            </Button>
            <button
              type="button"
              onClick={() => { setError(""); setMode("password") }}
              className="w-full text-sm text-center text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
            >
              Sign in with password instead
            </button>
          </form>
        )}

        {mode === "otp-verify" && (
          <form onSubmit={(e) => void handleVerifyCode(e)} className="space-y-4">
            <p className="text-sm text-[color:var(--text-secondary)] text-center">
              We sent a 6-digit code to <strong>{email}</strong>.
            </p>
            <Input
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
              {loading ? "Verifying…" : "Sign in"}
            </Button>
            <button
              type="button"
              onClick={() => { setError(""); setCode(""); setMode("otp-send") }}
              className="w-full text-sm text-center text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
            >
              Resend code
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[color:var(--text-secondary)]">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="font-medium text-[color:var(--accent-primary)] hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  )
}
