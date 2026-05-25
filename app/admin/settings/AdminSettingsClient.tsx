"use client"

import { useState, useTransition } from "react"

type Setting = {
  id: number
  key: string
  value: string
  description: string
  updated_by: number | null
  updated_at: string
  created_at: string
}

type AuditLog = {
  id: number
  key: string
  old_value: string
  new_value: string
  changed_by: number
  changed_at: string
}

type Props = {
  settings: Setting[]
  auditLogs: AuditLog[]
}

type Confirm = { key: string; from: string; to: string } | null

export function AdminSettingsClient({ settings: initial, auditLogs: initialLogs }: Props) {
  const [tab, setTab] = useState<"settings" | "audit">("settings")
  const [settings, setSettings] = useState(initial)
  const [auditLogs, setAuditLogs] = useState(initialLogs)
  const [editing, setEditing] = useState<Record<string, string>>({})
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function startEdit(key: string, currentValue: string) {
    setEditing((prev) => ({ ...prev, [key]: currentValue }))
  }

  function cancelEdit(key: string) {
    setEditing((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  function requestSave(key: string) {
    const newValue = editing[key]
    if (newValue === undefined) return
    const setting = settings.find((s) => s.key === key)
    const currentValue = setting?.value ?? ""
    if (newValue === currentValue) {
      cancelEdit(key)
      return
    }
    if (key.startsWith("fee_")) {
      setConfirm({ key, from: currentValue, to: newValue })
    } else {
      commitSave(key, newValue)
    }
  }

  function commitSave(key: string, value: string) {
    setConfirm(null)
    setSaving(key)
    setError(null)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/settings/${encodeURIComponent(key)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value }),
        })
        const json = await res.json()
        if (!res.ok) {
          setError(json.message ?? json.error ?? "Failed to save")
        } else {
          setSettings((prev) =>
            prev.map((s) => (s.key === key ? { ...s, value, updated_at: new Date().toISOString() } : s)),
          )
          cancelEdit(key)
          // refresh audit log
          const auditRes = await fetch("/api/admin/settings/audit")
          if (auditRes.ok) {
            const auditJson = await auditRes.json()
            setAuditLogs(auditJson.data)
          }
        }
      } catch {
        setError("Network error")
      } finally {
        setSaving(null)
      }
    })
  }

  function formatValue(key: string, value: string) {
    if (key.startsWith("fee_") && key !== "fee_subscription_progressive_enabled") {
      const n = parseFloat(value)
      if (!isNaN(n)) return `${(n * 100).toFixed(1)}%`
    }
    return value
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab("settings")}
          className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${
            tab === "settings"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Settings
        </button>
        <button
          onClick={() => setTab("audit")}
          className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${
            tab === "audit"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Audit Log
        </button>
      </div>

      {tab === "settings" && (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Key</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Value</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">Description</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden lg:table-cell">Updated</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {settings.map((s) => (
                <tr key={s.key} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs">{s.key}</td>
                  <td className="px-4 py-3">
                    {editing[s.key] !== undefined ? (
                      <input
                        className="border rounded px-2 py-1 text-sm w-28 font-mono"
                        value={editing[s.key]}
                        onChange={(e) =>
                          setEditing((prev) => ({ ...prev, [s.key]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") requestSave(s.key)
                          if (e.key === "Escape") cancelEdit(s.key)
                        }}
                        autoFocus
                      />
                    ) : (
                      <span className="font-mono">{formatValue(s.key, s.value)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{s.description}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                    {new Date(s.updated_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editing[s.key] !== undefined ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => requestSave(s.key)}
                          disabled={saving === s.key}
                          className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
                        >
                          {saving === s.key ? "Saving…" : "Save"}
                        </button>
                        <button
                          onClick={() => cancelEdit(s.key)}
                          className="text-xs px-2 py-1 border rounded hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(s.key, s.value)}
                        className="text-xs px-2 py-1 border rounded hover:bg-muted"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "audit" && (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Key</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Old</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">New</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">Changed by</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">When</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-sm">
                    No changes yet.
                  </td>
                </tr>
              )}
              {auditLogs.map((l) => (
                <tr key={l.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs">{l.key}</td>
                  <td className="px-4 py-3 font-mono text-xs text-destructive">{l.old_value}</td>
                  <td className="px-4 py-3 font-mono text-xs text-green-600">{l.new_value}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    #{l.changed_by}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(l.changed_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6 space-y-4">
            <h2 className="font-semibold text-lg">Confirm fee change</h2>
            <p className="text-sm text-muted-foreground">
              You are changing <span className="font-mono text-foreground">{confirm.key}</span> from{" "}
              <span className="font-mono text-foreground">{confirm.from}</span> to{" "}
              <span className="font-mono text-foreground">{confirm.to}</span>.
              <br />
              This affects all future transactions. Are you sure?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirm(null)}
                className="px-4 py-2 text-sm border rounded hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={() => commitSave(confirm.key, confirm.to)}
                className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded hover:opacity-90"
              >
                Confirm change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
