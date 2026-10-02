"use client"

import { useState } from "react"
import Link from "next/link"
import { Pencil, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { RowLabel, type SettingsIcon } from "@/components/settings/RowLabel"

// Settings row for changing the account email: current password, then a
// code sent to the new address. Afterwards other devices are signed out and
// the old address gets an alert.
export function EmailChangeField({
  initialEmail,
  hasPassword,
  icon,
}: {
  initialEmail: string
  hasPassword: boolean
  icon?: SettingsIcon
}) {
  const [email, setEmail] = useState(initialEmail)
  const [editing, setEditing] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [password, setPassword] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function reset() {
    setEditing(false)
    setNewEmail("")
    setPassword("")
    setCode("")
    setCodeSent(false)
    setError(null)
  }

  async function post(url: string, body: object): Promise<{ ok: boolean; json: { message?: string; data?: { email?: string } } }> {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
    return { ok: res.ok, json: await res.json() }
  }

  async function sendCode() {
    setBusy(true)
    setError(null)
    try {
      const { ok, json } = await post("/api/account/email/request-change", { new_email: newEmail, password })
      if (!ok) { setError(json.message ?? "Could not send the code"); return }
      setCodeSent(true)
    } catch {
      setError("Network error — please try again")
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      const { ok, json } = await post("/api/account/email/confirm-change", { new_email: newEmail, code })
      if (!ok) { setError(json.message ?? "Could not change your email"); return }
      setEmail(json.data?.email ?? newEmail.trim().toLowerCase())
      reset()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError("Network error — please try again")
    } finally {
      setBusy(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <RowLabel icon={icon} label="Email" />
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {saved ? (
            <span className="flex items-center gap-1 text-success"><Check className="h-3.5 w-3.5" />Saved</span>
          ) : (
            <><span className="truncate">{email}</span><Pencil className="h-3 w-3 shrink-0" /></>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3 px-4 py-4">
      <RowLabel icon={icon} label="Change email" />

      {!hasPassword ? (
        <>
          <p className="text-sm text-muted-foreground">
            For your security, changing your email needs your password. Your account doesn&apos;t have one yet —{" "}
            <Link href="/forgot-password" className="font-medium text-foreground underline">set one first</Link>.
          </p>
          <Button type="button" size="sm" variant="ghost" onClick={reset}>Close</Button>
        </>
      ) : !codeSent ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="new-email" className="text-xs">New email</Label>
            <Input id="new-email" type="email" autoComplete="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email-change-password" className="text-xs">Current password</Label>
            <PasswordInput id="email-change-password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={busy || !newEmail.includes("@") || !password} onClick={() => void sendCode()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code to new email"}
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={reset}>Cancel</Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm">
            Enter the 6-digit code we sent to <span className="font-medium">{newEmail}</span>.
          </p>
          <Input
            aria-label="Verification code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="text-center font-mono text-xl tracking-[0.5em]"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Your other devices will be signed out, and {email} will get an alert.
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={busy || code.length !== 6} onClick={() => void confirm()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change email"}
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setCodeSent(false)}>Back</Button>
          </div>
        </>
      )}
    </div>
  )
}
