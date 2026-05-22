"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown, Pencil, Trash2, Loader2, Check, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlatformIcon } from "@/components/PlatformIcon"
import { detectPlatform } from "@/lib/utils/platform"

export interface LinkItem {
  id: number
  url: string
  label: string
  is_enabled: boolean
  position: number
  clicks: number
}

interface LinkCardProps {
  link: LinkItem
  isFirst: boolean
  isLast: boolean
  onUpdate: (id: number, data: Partial<Pick<LinkItem, "url" | "label" | "is_enabled">>) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onReorder: (id: number, direction: "up" | "down") => Promise<void>
}

export function LinkCard({ link, isFirst, isLast, onUpdate, onDelete, onReorder }: LinkCardProps) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(link.label)
  const [url, setUrl] = useState(link.url)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    setSaving(true)
    navigator?.vibrate?.(20)
    try {
      await onUpdate(link.id, { label: label.trim(), url: url.trim() })
      setEditing(false)
    } catch {
      setError("Could not save — please try again")
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    navigator?.vibrate?.(20)
    setLabel(link.label)
    setUrl(link.url)
    setError(null)
    setEditing(false)
  }

  async function handleToggle() {
    navigator?.vibrate?.(20)
    try {
      await onUpdate(link.id, { is_enabled: !link.is_enabled })
    } catch {
      // rollback handled by parent
    }
  }

  async function handleDelete() {
    navigator?.vibrate?.(20)
    if (!confirm(`Delete "${link.label}"?`)) return
    setDeleting(true)
    try {
      await onDelete(link.id)
    } finally {
      setDeleting(false)
    }
  }

  async function handleReorder(direction: "up" | "down") {
    navigator?.vibrate?.(20)
    try {
      await onReorder(link.id, direction)
    } catch {
      // rollback handled by parent
    }
  }

  return (
    <div className={`bg-background border border-border rounded-xl p-4 space-y-3 transition-opacity duration-150 ${deleting ? "opacity-40 pointer-events-none" : ""}`}>
      {!editing ? (
        <div className="flex items-start gap-3">
          <div className="flex flex-col shrink-0">
            <button
              type="button"
              onClick={() => handleReorder("up")}
              disabled={isFirst}
              aria-label="Move up"
              className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors duration-150"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleReorder("down")}
              disabled={isLast}
              aria-label="Move down"
              className="p-1.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors duration-150"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className={`flex items-center gap-2 ${!link.is_enabled ? "text-muted-foreground" : ""}`}>
              <PlatformIcon platform={detectPlatform(link.url)} className="h-4 w-4 shrink-0" />
              <p className={`text-sm font-medium truncate ${!link.is_enabled ? "line-through" : ""}`}>
                {link.label}
              </p>
            </div>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground truncate max-w-full transition-colors duration-150"
            >
              <span className="truncate">{link.url}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
            <p className="text-xs text-muted-foreground mt-0.5">{link.clicks} click{link.clicks !== 1 ? "s" : ""}</p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={link.is_enabled}
              aria-label={link.is_enabled ? "Disable link" : "Enable link"}
              onClick={handleToggle}
              className={[
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                link.is_enabled ? "bg-primary" : "bg-muted",
              ].join(" ")}
            >
              <span
                className={[
                  "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200",
                  link.is_enabled ? "translate-x-4" : "translate-x-0",
                ].join(" ")}
              />
            </button>
            <button
              type="button"
              onClick={() => { navigator?.vibrate?.(20); setEditing(true) }}
              aria-label="Edit link"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors duration-150"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete link"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`label-${link.id}`} className="text-xs font-medium">Label</Label>
            <Input
              id={`label-${link.id}`}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="My website"
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`url-${link.id}`} className="text-xs font-medium">URL</Label>
            <Input
              id={`url-${link.id}`}
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              className="h-9 text-sm font-mono"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving} className="h-9">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              <span className="ml-1.5">{saving ? "Saving…" : "Save"}</span>
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving} className="h-9">
              <X className="h-3.5 w-3.5" />
              <span className="ml-1.5">Cancel</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
