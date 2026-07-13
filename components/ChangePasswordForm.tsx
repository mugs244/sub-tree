"use client"

import { useState } from "react"
import { Pencil, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ChangePasswordForm() {
  const [editing, setEditing] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setEditing(false)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.message ?? "Could not change password")
        return
      }
      setEditing(false)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("Could not change password — please try again")
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-sm text-muted-foreground">Password</span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          {saved ? (
            <span className="flex items-center gap-1 text-success"><Check className="h-3.5 w-3.5" />Saved</span>
          ) : (
            <>
              Change
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </>
          )}
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="px-4 py-4 space-y-3">
      <p className="text-sm text-muted-foreground">Password</p>

      <div className="space-y-1.5">
        <Label htmlFor="current-password" className="text-xs">Current password</Label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new-password" className="text-xs">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm-password" className="text-xs">Confirm new password</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save password"}
        </Button>
        <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={reset}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
