"use client"

import { useState } from "react"
import { Globe, ArrowLeft, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlatformIcon } from "@/components/PlatformIcon"
import { CATALOG, buildManualUrl, type CatalogEntry, type ConnectProvider } from "@/lib/platform-catalog"

// Add link: tap a platform, then either Connect (sign in, added
// automatically) or type the username / link / number. "Other link" is a
// plain label + URL for anything else.
export function AddLinkPanel({
  connectProviders,
  onAdd,
  onCancel,
}: {
  connectProviders: ConnectProvider[]
  onAdd: (url: string, label: string) => Promise<string | null>
  onCancel: () => void
}) {
  const [picked, setPicked] = useState<CatalogEntry | "other" | null>(null)
  const [value, setValue] = useState("")
  const [label, setLabel] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function pick(entry: CatalogEntry | "other") {
    navigator?.vibrate?.(20)
    setPicked(entry)
    setValue("")
    setLabel(entry === "other" ? "" : entry.name)
    setError(null)
  }

  async function submit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!picked) return
    let url: string
    if (picked === "other") {
      const v = value.trim()
      if (!v || !label.trim()) return setError("Add a label and a link")
      url = /^https?:\/\//i.test(v) ? v : `https://${v}`
    } else {
      const built = buildManualUrl(picked, value)
      if ("error" in built) return setError(built.error)
      url = built.url
    }
    setBusy(true)
    setError(null)
    const err = await onAdd(url, label.trim() || (picked === "other" ? url : picked.name))
    setBusy(false)
    if (err) setError(err)
  }

  // ── Platform grid ────────────────────────────────────────────────────────
  if (!picked) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Add a link</p>
          <button type="button" onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
        </div>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {CATALOG.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => pick(p)}
              className="relative flex flex-col items-center gap-1.5 rounded-xl border border-border bg-background px-1 py-3 text-xs font-medium transition-colors hover:border-foreground/30"
            >
              <PlatformIcon platform={p.icon} className="h-6 w-6" colored />
              <span className="truncate">{p.name}</span>
              {p.connect && connectProviders.includes(p.connect) && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ff8a3d]" title="Can connect automatically" />
              )}
            </button>
          ))}
          <button
            type="button"
            onClick={() => pick("other")}
            className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-border bg-background px-1 py-3 text-xs font-medium transition-colors hover:border-foreground/30"
          >
            <Globe className="h-6 w-6" strokeWidth={1.5} />
            <span>Other link</span>
          </button>
        </div>
        {connectProviders.length > 0 && (
          <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff8a3d]" /> Can be connected by signing in
          </p>
        )}
      </div>
    )
  }

  // ── One platform ─────────────────────────────────────────────────────────
  const entry = picked === "other" ? null : picked
  const canConnect = Boolean(entry?.connect && connectProviders.includes(entry.connect))
  const manual = entry?.manual
  const placeholder =
    !entry ? "https://…"
    : manual?.kind === "phone" ? "0772 123456"
    : manual?.kind === "url" ? manual.example
    : "@username"

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setPicked(null)} aria-label="Back to platforms" className="rounded-lg p-1 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </button>
        {entry ? <PlatformIcon platform={entry.icon} className="h-6 w-6" colored /> : <Globe className="h-6 w-6" strokeWidth={1.5} />}
        <p className="text-sm font-semibold">{entry?.name ?? "Other link"}</p>
      </div>

      {canConnect && entry?.connect && (
        <div className="space-y-2">
          <a
            href={`/api/connect/${entry.connect}`}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background"
          >
            <Link2 className="h-4 w-4" /> Connect {entry.name}
          </a>
          <p className="text-xs text-muted-foreground">Sign in to {entry.name} and we&apos;ll add your profile and tie it to your Sub-tree account.</p>
        </div>
      )}

      {canConnect && manual && (
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or add it yourself <span className="h-px flex-1 bg-border" />
        </div>
      )}

      {(manual || !entry) && (
        <>
          {!entry && (
            <div className="space-y-1.5">
              <Label htmlFor="add-label" className="text-sm font-medium">Label</Label>
              <Input id="add-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="My website" className="h-11" autoFocus />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="add-value" className="text-sm font-medium">
              {!entry ? "Link" : manual?.kind === "phone" ? "WhatsApp number" : manual?.kind === "url" ? `${entry.name} link` : `${entry.name} username or link`}
            </Label>
            <Input
              id="add-value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              inputMode={manual?.kind === "phone" ? "tel" : "url"}
              autoCapitalize="none"
              autoCorrect="off"
              className="h-11 font-mono text-sm"
              autoFocus={Boolean(entry) && !canConnect}
            />
            {entry?.hint && <p className="text-xs text-muted-foreground">{entry.hint}</p>}
          </div>
          {entry && (
            <div className="space-y-1.5">
              <Label htmlFor="add-label" className="text-xs font-medium text-muted-foreground">Button text</Label>
              <Input id="add-label" value={label} onChange={(e) => setLabel(e.target.value)} className="h-10 text-sm" />
            </div>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? "Adding…" : "Add link"}
          </Button>
        </>
      )}
    </form>
  )
}
