"use client"

import { useState } from "react"
import { Pencil, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UGANDA_BANKS } from "@/lib/banks"
import { RowLabel, type SettingsIcon } from "@/components/settings/RowLabel"

interface Saved {
  bankName: string
  accountName: string
  maskedNumber: string
}

// Settings row for the bank account withdrawals can be sent to. Saving needs
// a code emailed to the account owner, since this decides where money goes.
export function BankDetailsField({ initial, icon }: { initial: Saved | null; icon?: SettingsIcon }) {
  const [saved, setSaved] = useState<Saved | null>(initial)
  const [editing, setEditing] = useState(false)
  const [bankName, setBankName] = useState<string>(initial?.bankName ?? "")
  const [accountName, setAccountName] = useState(initial?.accountName ?? "")
  const [accountNumber, setAccountNumber] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)

  const detailsOk = bankName !== "" && accountName.trim().length >= 2 && /^\d{6,20}$/.test(accountNumber)

  function reset() {
    setEditing(false)
    setCodeSent(false)
    setCode("")
    setAccountNumber("")
    setError(null)
  }

  async function sendCode() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/account/bank/request-code", { method: "POST" })
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? "Could not send the code"); return }
      setCodeSent(true)
    } catch {
      setError("Network error — please try again")
    } finally {
      setBusy(false)
    }
  }

  async function save() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/account/bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, bank_name: bankName, account_name: accountName.trim(), account_number: accountNumber }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.message ?? "Could not save your bank details"); return }
      setSaved({ bankName, accountName: accountName.trim(), maskedNumber: `•••• ${accountNumber.slice(-4)}` })
      reset()
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2500)
    } catch {
      setError("Network error — please try again")
    } finally {
      setBusy(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-3.5">
        <div className="min-w-0">
          <RowLabel icon={icon} label="Bank account" />
          <p className={["truncate text-xs text-muted-foreground", icon ? "pl-8" : ""].join(" ")}>
            {saved ? `${saved.bankName} ${saved.maskedNumber} · ${saved.accountName}` : "Not added"}
          </p>
        </div>
        <button type="button" onClick={() => setEditing(true)} className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          {justSaved ? (
            <span className="flex items-center gap-1 text-success"><Check className="h-3.5 w-3.5" />Saved</span>
          ) : (
            <>{saved ? "Change" : "Add"}<Pencil className="h-3 w-3 text-muted-foreground" /></>
          )}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3 px-4 py-4">
      <p className="text-sm text-muted-foreground">Bank account</p>
      <p className="text-xs text-muted-foreground">
        Bank withdrawals are sent by the Sub-tree team, usually within 1–3 business days.
      </p>

      {!codeSent ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="bank-name" className="text-xs">Bank</Label>
            <select
              id="bank-name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="" disabled>Choose your bank</option>
              {UGANDA_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bank-account-name" className="text-xs">Name on the account</Label>
            <Input id="bank-account-name" value={accountName} onChange={(e) => setAccountName(e.target.value)} autoComplete="name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bank-account-number" className="text-xs">Account number</Label>
            <Input
              id="bank-account-number"
              inputMode="numeric"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 20))}
              placeholder={saved ? `Re-enter to change (${saved.maskedNumber})` : ""}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={!detailsOk || busy} onClick={() => void sendCode()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Email me a code"}
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={reset}>Cancel</Button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm">Enter the 6-digit code we emailed you to save these details.</p>
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
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={code.length !== 6 || busy} onClick={() => void save()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save bank details"}
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setCodeSent(false)}>Back</Button>
          </div>
        </>
      )}
    </div>
  )
}
