"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/brand/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const router = useRouter()

  const [mode, setMode] = useState<"request" | "reset">("request")
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState<number | null>(null)
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function requestCode() {
    if (loading) return
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return }
      setUserId(data.userId)
      setMode("reset")
    } finally {
      setLoading(false)
    }
  }

  function handleRequestCode(e: React.FormEvent) {
    e.preventDefault()
    void requestCode()
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (newPassword.length < 8) { setError("Password must be at least 8 characters"); return }
    if (newPassword !== confirmPassword) { setError("Passwords don't match"); return }

    setLoading(true)
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, code, new_password: newPassword }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "Something went wrong"); return }
    router.push(data.isAdmin ? "/admin" : "/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[color:var(--bg-base)]">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo variant="icon" />
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "request" ? "Reset your password" : "Set a new password"}
          </h1>
        </div>

        {mode === "request" && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <p className="text-sm text-[color:var(--text-secondary)] text-center">
              We&apos;ll email you a 6-digit code to reset your password.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send reset code"}
            </Button>
          </form>
        )}

        {mode === "reset" && (
          <form onSubmit={(e) => void handleResetPassword(e)} className="space-y-4">
            <p className="text-sm text-[color:var(--text-secondary)] text-center">
              We sent a 6-digit code to <strong>{email}</strong>.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <PasswordInput id="new-password" autoComplete="new-password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <PasswordInput id="confirm-password" autoComplete="new-password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading || code.length < 6}>
              {loading ? "Saving…" : "Save new password"}
            </Button>
            <button
              type="button"
              onClick={() => { setError(""); setCode(""); void requestCode() }}
              disabled={loading}
              className="w-full text-sm text-center text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors disabled:opacity-50"
            >
              {loading ? "Sending…" : "Resend code"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[color:var(--text-secondary)]">
          Remembered your password?{" "}
          <Link href="/sign-in" className="font-medium text-[color:var(--accent-primary)] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
