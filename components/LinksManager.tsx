"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LinkCard, type LinkItem } from "@/components/LinkCard"

interface LinksManagerProps {
  initialLinks: LinkItem[]
}

export function LinksManager({ initialLinks }: LinksManagerProps) {
  const [links, setLinks] = useState<LinkItem[]>(initialLinks)
  const [showAdd, setShowAdd] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [newLabel, setNewLabel] = useState("")
  const [addError, setAddError] = useState<string | null>(null)

  async function handleAdd(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setAddError(null)
    if (!newUrl.trim() || !newLabel.trim()) {
      setAddError("Both URL and label are required")
      return
    }

    const savedUrl = newUrl.trim()
    const savedLabel = newLabel.trim()
    const tempId = -(Date.now())
    const tempLink: LinkItem = {
      id: tempId,
      url: savedUrl,
      label: savedLabel,
      is_enabled: true,
      position: links.length,
      clicks: 0,
    }

    setLinks((cur) => [...cur, tempLink])
    setNewUrl("")
    setNewLabel("")
    setShowAdd(false)

    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: savedUrl, label: savedLabel }),
      })
      if (!res.ok) {
        const body = (await res.json()) as { message: string }
        setLinks((cur) => cur.filter((l) => l.id !== tempId))
        setAddError(body.message ?? "Could not add link")
        setShowAdd(true)
        setNewUrl(savedUrl)
        setNewLabel(savedLabel)
        return
      }
      const fresh = await fetch("/api/links")
      const { data } = (await fresh.json()) as { data: LinkItem[] }
      setLinks(data)
    } catch {
      setLinks((cur) => cur.filter((l) => l.id !== tempId))
      setAddError("Could not add link — please try again")
      setShowAdd(true)
      setNewUrl(savedUrl)
      setNewLabel(savedLabel)
    }
  }

  async function handleUpdate(id: number, data: Partial<Pick<LinkItem, "url" | "label" | "is_enabled">>) {
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

  return (
    <div className="space-y-3">
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
        <form
          onSubmit={handleAdd}
          className="bg-surface border border-border rounded-xl p-4 space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="new-label" className="text-xs font-medium">Label</Label>
            <Input
              id="new-label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="My website"
              className="h-9 text-sm"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-url" className="text-xs font-medium">URL</Label>
            <Input
              id="new-url"
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://…"
              className="h-9 text-sm font-mono"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="h-9">Add link</Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-9"
              onClick={() => {
                navigator?.vibrate?.(20)
                setShowAdd(false)
                setAddError(null)
                setNewUrl("")
                setNewLabel("")
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          className="w-full border-dashed h-11 text-muted-foreground hover:text-foreground"
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
