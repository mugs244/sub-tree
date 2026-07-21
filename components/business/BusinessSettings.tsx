"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED"
type Role = "OWNER" | "ADMIN" | "EDITOR"

const VERIFICATION_COPY: Record<VerificationStatus, { label: string; hint: string }> = {
  UNVERIFIED: { label: "Not verified", hint: "Submit your account for review to get the verified mark." },
  PENDING: { label: "Under review", hint: "Your account is being reviewed. The verified mark appears once approved." },
  VERIFIED: { label: "Verified", hint: "Your account carries the verified mark across Sub-tree." },
}

export function BusinessSettings({
  companyName: initialName,
  plan,
  verificationStatus,
  role,
}: {
  companyName: string
  plan: "STARTUP" | "GROWTH" | "ENTERPRISE"
  verificationStatus: VerificationStatus
  role: Role
}) {
  const router = useRouter()
  const [companyName, setCompanyName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const canEdit = role === "OWNER" || role === "ADMIN"
  const canSubmitVerification = role === "OWNER" && verificationStatus === "UNVERIFIED"
  const v = VERIFICATION_COPY[verificationStatus]

  async function save() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch("/api/business/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: companyName.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? "Could not save settings")
        return
      }
      setSaved(true)
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setSaving(false)
    }
  }

  async function submitVerification() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/business/settings/verify", { method: "POST" })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? "Could not submit for verification")
        return
      }
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="px-4 py-5 md:p-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 space-y-4">
        <h2 className="text-sm font-medium">Account</h2>
        <div className="space-y-1.5">
          <Label htmlFor="company-name">Company name</Label>
          <Input
            id="company-name"
            value={companyName}
            onChange={(e) => { setCompanyName(e.target.value); setSaved(false) }}
            disabled={!canEdit}
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Plan</span>
          <span className="font-medium">{plan.charAt(0) + plan.slice(1).toLowerCase()}</span>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
        {saved && <p className="text-xs text-success">Saved</p>}
        {canEdit && (
          <Button onClick={() => void save()} disabled={saving || companyName.trim() === initialName.trim() || companyName.trim().length < 2}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        )}
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 sm:p-6 space-y-3">
        <div className="flex items-center gap-2">
          <BadgeCheck
            className={["h-5 w-5", verificationStatus === "VERIFIED" ? "text-foreground" : "text-muted-foreground/40"].join(" ")}
            strokeWidth={1.75}
          />
          <h2 className="text-sm font-medium">Verification — {v.label}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{v.hint}</p>
        {canSubmitVerification && (
          <Button variant="outline" onClick={() => void submitVerification()} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit for verification"}
          </Button>
        )}
      </div>
    </div>
  )
}
