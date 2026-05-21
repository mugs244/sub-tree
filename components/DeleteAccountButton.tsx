"use client"

import { useState } from "react"
import { useClerk } from "@clerk/nextjs"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DeleteAccountButton() {
  const { signOut } = useClerk()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch("/api/account/delete", { method: "POST" })
      if (!res.ok) {
        const body = (await res.json()) as { message?: string }
        setError(body.message ?? "Could not delete account")
        return
      }
      // Sign out before redirecting
      await signOut({ redirectUrl: "/" })
    } catch {
      setError("Could not delete account — please try again")
    } finally {
      setDeleting(false)
    }
  }

  if (confirming) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-destructive">Are you sure? This cannot be undone.</p>
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button
            variant="destructive"
            size="sm"
            disabled={deleting}
            onClick={handleDelete}
          >
            {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {deleting ? "Deleting…" : "Yes, delete my account"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={deleting}
            onClick={() => { setConfirming(false); setError(null) }}
          >
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
      Delete account
    </Button>
  )
}
