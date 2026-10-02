"use client"

import { useState } from "react"
import { Send, Check, X, Loader2 } from "lucide-react"

type Group = { group: string; emails: { key: string; label: string }[] }
type Result = { to: string; subject: string; ok: boolean; id?: string; error?: string }
type Outcome = { key: string; label: string; results: Result[]; error?: string }
type Status = { state: "sending" } | { state: "done"; outcome: Outcome }

// One row per email; "Send" sends that one, "Send all" sends every email in
// order. Shows exactly what Resend said for each.
export function EmailTester({ groups }: { groups: Group[] }) {
  const [status, setStatus] = useState<Record<string, Status>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function send(keys: string[]) {
    setBusy(true)
    setError(null)
    setStatus((s) => ({ ...s, ...Object.fromEntries(keys.map((k) => [k, { state: "sending" } as Status])) }))
    try {
      const res = await fetch("/api/admin/emails", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keys }) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error ?? `Request failed (${res.status})`)
      const outcomes: Outcome[] = json.data.outcomes
      setStatus((s) => ({ ...s, ...Object.fromEntries(outcomes.map((o) => [o.key, { state: "done", outcome: o } as Status])) }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error")
      setStatus((s) => Object.fromEntries(Object.entries(s).filter(([k]) => !keys.includes(k))))
    } finally {
      setBusy(false)
    }
  }

  const all = groups.flatMap((g) => g.emails.map((e) => e.key))
  const done = Object.values(status).filter((s): s is Extract<Status, { state: "done" }> => s.state === "done")
  const failed = done.filter((s) => !passed(s.outcome)).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => void send(all)}
          className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send all {all.length}
        </button>
        {done.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {done.length - failed} sent{failed > 0 ? `, ${failed} failed` : ""}
          </span>
        )}
        {error && <span className="text-sm text-destructive">{error}</span>}
      </div>
      <p className="text-xs text-muted-foreground">Sending all takes about half a minute, because Resend allows roughly two emails a second.</p>

      {groups.map((g) => (
        <section key={g.group} className="space-y-2">
          <h2 className="text-sm font-semibold">{g.group}</h2>
          <div className="divide-y divide-border rounded-xl border border-border">
            {g.emails.map((e) => {
              const s = status[e.key]
              return (
                <div key={e.key} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{e.label}</p>
                    {s?.state === "done" && <OutcomeLine o={s.outcome} />}
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void send([e.key])}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface disabled:opacity-50"
                  >
                    {s?.state === "sending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : s?.state === "done" ? (passed(s.outcome) ? <Check className="h-3.5 w-3.5 text-success" /> : <X className="h-3.5 w-3.5 text-destructive" />)
                      : <Send className="h-3.5 w-3.5" />}
                    {s?.state === "done" ? "Send again" : "Send"}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}

function passed(o: Outcome): boolean {
  return !o.error && o.results.length > 0 && o.results.every((r) => r.ok)
}

function OutcomeLine({ o }: { o: Outcome }) {
  if (o.error) return <p className="mt-0.5 text-xs text-destructive">Error: {o.error}</p>
  if (o.results.length === 0) return <p className="mt-0.5 text-xs text-destructive">No email was sent. Check the account has an email address.</p>
  return (
    <>
      {o.results.map((r, i) => (
        <p key={i} className={["mt-0.5 break-words text-xs", r.ok ? "text-muted-foreground" : "text-destructive"].join(" ")}>
          {r.ok ? `Sent: ${r.subject}` : `Failed: ${r.error}`}
        </p>
      ))}
    </>
  )
}
