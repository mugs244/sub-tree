"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LinkCard, type LinkItem } from "@/components/LinkCard"
import { AddLinkPanel } from "@/components/AddLinkPanel"
import { CATALOG, buildManualUrl, type ConnectProvider } from "@/lib/platform-catalog"

interface LinksManagerProps {
  initialLinks: LinkItem[]
  /** Platforms whose Connect (sign-in) is set up. */
  connectProviders: ConnectProvider[]
  /** Set after coming back from a platform's sign-in. */
  connected: { provider: string; linkId: number } | null
  connectError: string | null
}

export function LinksManager({ initialLinks, connectProviders, connected, connectError }: LinksManagerProps) {
  const router = useRouter()
  const [links, setLinks] = useState<LinkItem[]>(initialLinks)
  const [showAdd, setShowAdd] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ provider: string; linkId: number } | null>(connected)
  const [noticeError, setNoticeError] = useState<string | null>(connectError)

  // Adds a link; returns an error message, or null when it worked.
  async function addLinkRequest(url: string, label: string): Promise<string | null> {
    setAddError(null)
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, label }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string }
        return body.message ?? "Could not add link"
      }
      const fresh = await fetch("/api/links")
      const { data } = (await fresh.json()) as { data: LinkItem[] }
      setLinks(data)
      setShowAdd(false)
      return null
    } catch {
      return "Could not add link — please try again"
    }
  }

  function dismissNotice() {
    setNotice(null)
    setNoticeError(null)
    router.replace("/dashboard/links", { scroll: false })
  }

  async function handleUpdate(id: number, data: Partial<Pick<LinkItem, "url" | "label" | "is_enabled" | "render_as_plain">>) {
    const snapshot = links.find((l) => l.id === id)
    setLinks((cur) => cur.map((l) => (l.id === id ? { ...l, ...data } : l)))
    const res = await fetch(`/api/links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      if (snapshot) setLinks((cur) => cur.map((l) => (l.id === id ? snapshot : l)))
      throw new Error("Update failed")
    }
  }

  async function handleDelete(id: number) {
    const snapshot = [...links]
    setLinks((cur) => cur.filter((l) => l.id !== id).map((l, i) => ({ ...l, position: i })))
    const res = await fetch(`/api/links/${id}`, { method: "DELETE" })
    if (!res.ok) {
      setLinks(snapshot)
      throw new Error("Delete failed")
    }
  }

  async function handleReorder(id: number, direction: "up" | "down") {
    const snapshot = [...links]
    setLinks((prev) => {
      const idx = prev.findIndex((l) => l.id === id)
      const swapIdx = direction === "up" ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[swapIdx]] = [next[swapIdx]!, next[idx]!]
      return next.map((l, i) => ({ ...l, position: i }))
    })
    const res = await fetch(`/api/links/${id}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    })
    if (!res.ok) {
      setLinks(snapshot)
      throw new Error("Reorder failed")
    }
  }

  const connectedName = notice ? CATALOG.find((c) => c.connect === notice.provider)?.name ?? "Account" : null

  return (
    <div className="space-y-3">
      {noticeError && (
        <div className="flex items-start justify-between gap-3 rounded-xl bg-error-bg px-4 py-3 text-sm text-error">
          <span>{noticeError}</span>
          <button type="button" onClick={dismissNotice} aria-label="Dismiss"><X className="h-4 w-4" /></button>
        </div>
      )}
      {notice && (
        notice.provider === "spotify"
          ? <SpotifyFollowUp linkId={notice.linkId} onSave={(url) => handleUpdate(notice.linkId, { url })} onDone={dismissNotice} />
          : (
            <div className="flex items-start justify-between gap-3 rounded-xl bg-success-bg px-4 py-3 text-sm text-success">
              <span>{connectedName} connected — your profile link has been added.</span>
              <button type="button" onClick={dismissNotice} aria-label="Dismiss"><X className="h-4 w-4" /></button>
            </div>
          )
      )}
      {links.length === 0 && !showAdd && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No links yet. Add your first one below.
        </p>
      )}

      {links.map((link, idx) => (
        <LinkCard
          key={link.id}
          link={link}
          isFirst={idx === 0}
          isLast={idx === links.length - 1}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onReorder={handleReorder}
        />
      ))}

      {addError && <p className="text-xs text-destructive">{addError}</p>}

      {showAdd ? (
        <AddLinkPanel connectProviders={connectProviders} onAdd={addLinkRequest} onCancel={() => setShowAdd(false)} />
      ) : (
        <Button
          variant="outline"
          className="w-full border-dashed h-12 text-muted-foreground hover:text-foreground"
          onClick={() => {
            navigator?.vibrate?.(20)
            setShowAdd(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add link
        </Button>
      )}
    </div>
  )
}

// Spotify sign-in only proves the listener account. Artists and podcasters
// swap in their artist or show page so fans land on their music.
function SpotifyFollowUp({ onSave, onDone }: { linkId: number; onSave: (url: string) => Promise<void>; onDone: () => void }) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const spotify = CATALOG.find((c) => c.id === "spotify")!

  async function save(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const built = buildManualUrl(spotify, value)
    if ("error" in built) return setError(built.error)
    setBusy(true)
    try {
      await onSave(built.url)
      onDone()
    } catch {
      setError("Couldn't save — please try again")
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="space-y-3 rounded-xl border border-border bg-surface p-4">
      <p className="text-sm font-semibold">Spotify connected</p>
      <p className="text-xs text-muted-foreground">
        Your Spotify account is tied to Sub-tree. Are you an artist or podcaster? Paste your artist or show link so fans go
        straight to your music — or skip to keep your profile link.
      </p>
      <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://open.spotify.com/artist/…" className="h-11 font-mono text-sm" autoCapitalize="none" />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" className="h-10 flex-1" disabled={busy}>{busy ? "Saving…" : "Use this link"}</Button>
        <Button type="button" variant="ghost" className="h-10 flex-1" onClick={onDone}>Skip</Button>
      </div>
    </form>
  )
}
