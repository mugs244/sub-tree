"use client"

import { useState } from "react"
import { Pencil, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface NumberChangeFieldProps {
  label: string
  initialValue: string | null
  requestUrl: string
  confirmUrl: string
  fieldName: "new_phone" | "new_momo_number"
}

export function NumberChangeField({ label, initialValue, requestUrl, confirmUrl, fieldName }: NumberChangeFieldProps) {
  const [value, setValue] = useState(initialValue ?? "—")
  const [editing, setEditing] = useState(false)
  const [step, setStep] = useState<"number" | "code">("number")
  const [newNumber, setNewNumber] = useState("")
  const [channel, setChannel] = useState<"sms" | "email">("sms")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setEditing(false)
    setStep("number")
    setNewNumber("")
    setCode("")
    setError(null)
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(requestUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [fieldName]: newNumber, channel }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.message ?? "Could not send code")
        return
      }
      setStep("code")
    } catch {
      setError("Could not send code — please try again")
    } finally {
      setLoading(false)
    }
  }

  async function confirmCode(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(confirmUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [fieldName]: newNumber, code }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.message ?? "Invalid code")
        return
      }
      setValue(newNumber)
      reset()
    } catch {
      setError("Could not confirm code — please try again")
    } finally {
      setLoading(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-sm font-medium font-mono hover:underline"
        >
          {value}
          <Pencil className="h-3 w-3 text-muted-foreground shrink-0" />
        </button>
      </div>
    )
  }

  if (step === "code") {
    return (
      <form onSubmit={confirmCode} className="px-4 py-4 space-y-2">
        <p className="text-sm text-muted-foreground">
          Code sent to {channel === "sms" ? newNumber : "your email"}.
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            className="text-center text-lg tracking-[0.4em] font-mono"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            autoFocus
          />
          <Button type="submit" size="sm" disabled={loading || code.length < 6}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <button type="button" onClick={reset} className="text-xs text-muted-foreground hover:underline">
          Cancel
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={sendCode} className="px-4 py-4 space-y-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <Input
        type="tel"
        placeholder="0771234567"
        value={newNumber}
        onChange={(e) => setNewNumber(e.target.value)}
        autoFocus
      />
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="radio" name={`${fieldName}-channel`} checked={channel === "sms"} onChange={() => setChannel("sms")} />
          Text the new number
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" name={`${fieldName}-channel`} checked={channel === "email"} onChange={() => setChannel("email")} />
          Email me instead
        </label>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading || !newNumber}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={loading} onClick={reset}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
