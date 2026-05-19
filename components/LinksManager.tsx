"use client"

import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
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
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setAddError(null)
    if (!newUrl.trim() || !newLabel.trim()) {
      setAddError("Both URL and label are required")
      return
    }
    setAdding(true)
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl.trim(), label: newLabel.trim() }),
      })
      if (!res.ok) {
        const body = (await res.json()) as { message: string }
        setAddError(body.message ?? "Could not add link")
        return
      }
      const fresh = await fetch("/api/links")
      const { data } = (await fresh.json()) as { data: LinkItem[] }
      setLinks(data)
      setNewUrl("")
      setNewLabel("")
      setShowAdd(false)
    } catch {
      setAddError("Could not add link — please try again")
    } finally {
      setAdding(false)
    }
  }

  async function handleUpdate(id: number, data: Partial<Pick<LinkItem, "url" | "label" | "is_enabled">>) {
    const res = await fetch(`/api/links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Update failed")
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, ...data } : l)))
  }

  async function handleDelete(id: number) {
    const res = await fetch(`/api/links/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error("Delete failed")
    setLinks((prev) => prev.filter((l) => l.id !== id).map((l, i) => ({ ...l, position: i })))
  }

  async function handleReorder(id: number, direction: "up" | "down") {
    const res = await fetch(`/api/links/${id}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ direction }),
    })
    if (!res.ok) throw new Error("Reorder failed")
    setLinks((prev) => {
      const idx = prev.findIndex((l) => l.id === id)
      const swapIdx = direction === "up" ? idx - 1 : idx + 1
      if (swapIdx < 0 || swapIdx >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[swapIdx]] = [next[swapIdx]!, next[idx]!]
      return next.map((l, i) => ({ ...l, position: i }))
    })
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
              className="h-8 text-sm"
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
              className="h-8 text-sm font-mono"
            />
          </div>
          {addError && <p className="text-xs text-destructive">{addError}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={adding} className="h-8">
              {adding && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              {adding ? "Adding…" : "Add link"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8"
              onClick={() => { setShowAdd(false); setAddError(null); setNewUrl(""); setNewLabel("") }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          className="w-full border-dashed h-10 text-muted-foreground hover:text-foreground"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add link
        </Button>
      )}
    </div>
  )
}
