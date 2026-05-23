"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown, Pencil, Trash2, Loader2, Check, X, ExternalLink, RefreshCw, Image } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlatformIcon } from "@/components/PlatformIcon"
import { detectPlatform } from "@/lib/utils/platform"
import type { SmartCardMeta } from "@/lib/services/smart-links"

export interface LinkItem {
  id: number
  url: string
  label: string
  is_enabled: boolean
  position: number
  clicks: number
  link_type: string
  smart_card_meta: unknown
  render_as_plain: boolean
}

interface LinkCardProps {
  link: LinkItem
  isFirst: boolean
  isLast: boolean
  onUpdate: (id: number, data: Partial<Pick<LinkItem, "url" | "label" | "is_enabled" | "render_as_plain">>) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onReorder: (id: number, direction: "up" | "down") => Promise<void>
}

export function LinkCard({ link, isFirst, isLast, onUpdate, onDelete, onReorder }: LinkCardProps) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(link.label)
  const [url, setUrl] = useState(link.url)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const meta = link.smart_card_meta as SmartCardMeta | null
  const isSmart = link.link_type === "SMART_CARD" && meta != null

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
    try { await onUpdate(link.id, { is_enabled: !link.is_enabled }) } catch {}
  }

  async function handleTogglePlain() {
    navigator?.vibrate?.(20)
    try { await onUpdate(link.id, { render_as_plain: !link.render_as_plain }) } catch {}
  }

  async function handleDelete() {
    navigator?.vibrate?.(20)
    if (!confirm(`Delete "${link.label}"?`)) return
    setDeleting(true)
    try { await onDelete(link.id) } finally { setDeleting(false) }
  }

  async function handleReorder(direction: "up" | "down") {
    navigator?.vibrate?.(20)
    try { await onReorder(link.id, direction) } catch {}
  }

  async function handleRefreshMeta() {
    setRefreshing(true)
    try {
      await fetch(`/api/links/${link.id}/refresh-metadata`, { method: "POST" })
      window.location.reload()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className={`bg-background border border-border rounded-xl overflow-hidden transition-opacity duration-150 ${deleting ? "opacity-40 pointer-events-none" : ""}`}>
      {!editing ? (
        <>
          {/* ── Smart card preview strip ───────────────────── */}
          {isSmart && !link.render_as_plain && (
            <div className="px-4 pt-3 pb-1">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted-foreground">
                <Image className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{meta!.title}</span>
                <span className="ml-auto shrink-0 capitalize">{meta!.platform}</span>
              </div>
            </div>
          )}

          {/* ── Content row ──────────────────────────────────── */}
          <div className="flex items-center gap-3 px-4 py-4">
            <PlatformIcon platform={detectPlatform(link.url)} className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium leading-snug truncate ${!link.is_enabled ? "line-through text-muted-foreground" : ""}`}>
                {link.label}
              </p>
              <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">{link.url}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{link.clicks} click{link.clicks !== 1 ? "s" : ""}</p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={link.is_enabled}
              aria-label={link.is_enabled ? "Disable link" : "Enable link"}
              onClick={handleToggle}
              className={[
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                link.is_enabled ? "bg-primary" : "bg-muted",
              ].join(" ")}
            >
              <span className={["pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200", link.is_enabled ? "translate-x-5" : "translate-x-0"].join(" ")} />
            </button>
          </div>

          {/* ── Smart card options ────────────────────────────── */}
          {isSmart && (
            <div className="px-4 pb-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTogglePlain}
                className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.render_as_plain ? "Show rich card" : "Render as plain link"}
              </button>
              <button
                type="button"
                onClick={handleRefreshMeta}
                disabled={refreshing}
                className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <RefreshCw className={["h-3 w-3", refreshing ? "animate-spin" : ""].join(" ")} />
                Refresh preview
              </button>
            </div>
          )}

          {/* ── Action strip ─────────────────────────────────── */}
          <div className="flex items-stretch border-t border-border divide-x divide-border">
            <button type="button" onClick={() => handleReorder("up")} disabled={isFirst} aria-label="Move up"
              className="flex flex-1 items-center justify-center py-3.5 text-muted-foreground hover:text-foreground hover:bg-surface disabled:opacity-30 transition-colors duration-150">
              <ChevronUp className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => handleReorder("down")} disabled={isLast} aria-label="Move down"
              className="flex flex-1 items-center justify-center py-3.5 text-muted-foreground hover:text-foreground hover:bg-surface disabled:opacity-30 transition-colors duration-150">
              <ChevronDown className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => { navigator?.vibrate?.(20); setEditing(true) }} aria-label="Edit link"
              className="flex flex-1 items-center justify-center py-3.5 text-muted-foreground hover:text-foreground hover:bg-surface transition-colors duration-150">
              <Pencil className="h-4 w-4" />
            </button>
            <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label="Open link"
              className="flex flex-1 items-center justify-center py-3.5 text-muted-foreground hover:text-foreground hover:bg-surface transition-colors duration-150">
              <ExternalLink className="h-4 w-4" />
            </a>
            <button type="button" onClick={handleDelete} disabled={deleting} aria-label="Delete link"
              className="flex flex-1 items-center justify-center py-3.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </>
      ) : (
        <div className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor={`label-${link.id}`} className="text-sm font-medium">Label</Label>
            <Input id={`label-${link.id}`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="My website" className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`url-${link.id}`} className="text-sm font-medium">URL</Label>
            <Input id={`url-${link.id}`} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="h-11 font-mono text-sm" />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="h-11 flex-1">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button variant="ghost" onClick={handleCancel} disabled={saving} className="h-11 flex-1">
              <X className="h-4 w-4 mr-2" />Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
