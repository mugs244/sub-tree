"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { UsernameAvailability } from "@/lib/services/username"

type CheckState =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "taken" }
  | { state: "reserved" }
  | { state: "invalid"; reason: string }
  | { state: "error" }

export function UsernameForm({ nextPath = "/onboarding/profile" }: { nextPath?: string }) {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [check, setCheck] = useState<CheckState>({ state: "idle" })
  const [submitting, setSubmitting] = useState(false)
  const [requestingReserved, setRequestingReserved] = useState(false)
  const [reservedRequested, setReservedRequested] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (abortRef.current) abortRef.current.abort()

    const trimmed = username.trim()
    if (!trimmed) {
      setCheck({ state: "idle" })
      return
    }

    setCheck({ state: "checking" })
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const res = await fetch(`/api/onboarding/check-username?username=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        const data = (await res.json()) as UsernameAvailability
        if (data.status === "invalid") {
          setCheck({ state: "invalid", reason: data.reason })
        } else {
          setCheck({ state: data.status })
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setCheck({ state: "error" })
      }
    }, 350)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [username])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (check.state !== "available") return

    setSubmitting(true)
    try {
      const res = await fetch("/api/onboarding/claim-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      })

      if (!res.ok) {
        const body = (await res.json()) as { error: string; message: string }
        if (body.error === "USERNAME_TAKEN") setCheck({ state: "taken" })
        else if (body.error === "USERNAME_RESERVED") setCheck({ state: "reserved" })
        else setCheck({ state: "error" })
        return
      }

      router.push(nextPath)
    } catch {
      setCheck({ state: "error" })
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = check.state === "available" && !submitting

  async function handleRequestReserved() {
    setRequestingReserved(true)
    try {
      const res = await fetch("/api/onboarding/request-reserved-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      })
      if (res.ok || res.status === 202) {
        setReservedRequested(username.trim())
      }
    } catch {
      // silently ignore — request can be retried
    } finally {
      setRequestingReserved(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="username" className="text-sm font-medium">
          Choose your username
        </Label>

        <div className="relative">
          <Input
            id="username"
            type="text"
            autoComplete="username"
            spellCheck={false}
            placeholder="yourname"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
            className={[
              "pr-10 font-mono",
              check.state === "invalid" || check.state === "taken" || check.state === "reserved"
                ? "border-[color:var(--state-error)] focus-visible:ring-[color:var(--state-error)]/20"
                : check.state === "available"
                  ? "border-[color:var(--state-success)] focus-visible:ring-[color:var(--state-success)]/20"
                  : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <StatusIcon state={check.state} />
          </span>
        </div>

        <div className="min-h-[18px]">
          <StatusMessage state={check} username={username.trim()} />
        </div>

        {check.state === "reserved" && (
          <div className="text-xs pt-0.5">
            {reservedRequested === username.trim() ? (
              <p className="text-[color:var(--state-success)]">
                Request submitted — we&apos;ll review it within 48 hours.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleRequestReserved}
                disabled={requestingReserved}
                className="text-foreground underline underline-offset-2 hover:no-underline transition-all duration-150 disabled:opacity-50"
              >
                {requestingReserved ? "Submitting…" : "Request this username →"}
              </button>
            )}
          </div>
        )}
      </div>

      {username && check.state !== "idle" && check.state !== "checking" && (
        <p className="text-xs text-[color:var(--text-muted)] font-mono">
          sub-tree.com/<span className="text-[color:var(--text-primary)]">{username}</span>
        </p>
      )}

      <Button type="submit" className="w-full" disabled={!canSubmit}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Claiming…
          </>
        ) : (
          "Claim username"
        )}
      </Button>

      <p className="text-xs text-center text-[color:var(--text-muted)]">
        You can change your username later from account settings.
      </p>
    </form>
  )
}

function StatusIcon({ state }: { state: CheckState["state"] }) {
  if (state === "checking") return <Loader2 className="h-4 w-4 animate-spin text-[color:var(--text-muted)]" />
  if (state === "available") return <CheckCircle className="h-4 w-4 text-[color:var(--state-success)]" />
  if (state === "taken" || state === "invalid" || state === "reserved")
    return <XCircle className="h-4 w-4 text-[color:var(--state-error)]" />
  if (state === "error") return <AlertTriangle className="h-4 w-4 text-[color:var(--state-warning)]" />
  return null
}

function StatusMessage({ state, username }: { state: CheckState; username: string }) {
  if (!username || state.state === "idle") return null

  if (state.state === "checking") {
    return <p className="text-xs text-[color:var(--text-muted)]">Checking availability…</p>
  }
  if (state.state === "available") {
    return <p className="text-xs text-[color:var(--state-success)]">@{username} is available</p>
  }
  if (state.state === "taken") {
    return <p className="text-xs text-[color:var(--state-error)]">@{username} is already taken</p>
  }
  if (state.state === "reserved") {
    return <p className="text-xs text-[color:var(--state-error)]">@{username} is a reserved username</p>
  }
  if (state.state === "invalid") {
    return <p className="text-xs text-[color:var(--state-error)]">{state.reason}</p>
  }
  if (state.state === "error") {
    return <p className="text-xs text-[color:var(--state-warning)]">Could not check availability — try again</p>
  }
  return null
}
