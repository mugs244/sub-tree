"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface FundraiserFormProps {
  fundraiserId?: number
  initial?: {
    title: string
    description: string
    goal_amount: number
    deadline: string | null
    cover_image_url: string | null
    show_progress: boolean
    fundraiser_type: "PERSONAL" | "CHARITY"
  }
}

export function FundraiserForm({ fundraiserId, initial }: FundraiserFormProps) {
  const router = useRouter()
  const isEdit = fundraiserId !== undefined

  const [title, setTitle]               = useState(initial?.title ?? "")
  const [description, setDescription]   = useState(initial?.description ?? "")
  const [goalAmount, setGoalAmount]     = useState(initial?.goal_amount?.toString() ?? "")
  const [deadline, setDeadline]         = useState(initial?.deadline?.slice(0, 10) ?? "")
  const [coverUrl, setCoverUrl]         = useState(initial?.cover_image_url ?? "")
  const [showProgress, setShowProgress] = useState(initial?.show_progress ?? true)
  const [type, setType]                 = useState<"PERSONAL" | "CHARITY">(initial?.fundraiser_type ?? "PERSONAL")
  const [businessHandle, setBusinessHandle] = useState("")
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const goalNum = parseInt(goalAmount, 10)
    if (isNaN(goalNum) || goalNum <= 0) {
      setError("Goal amount must be a positive number")
      return
    }

    if (type === "CHARITY" && !businessHandle.trim()) {
      setError("Enter the handle of the business you are fundraising for")
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        goal_amount: goalNum,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        cover_image_url: coverUrl.trim() || undefined,
        show_progress: showProgress,
        fundraiser_type: type,
      }

      const res = await fetch(
        isEdit ? `/api/fundraisers/${fundraiserId}` : "/api/fundraisers",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      )

      if (!res.ok) {
        const body = (await res.json()) as { message?: string }
        setError(body.message ?? "Could not save — please try again")
        return
      }

      const created = (await res.json()) as { data?: { id?: number } }

      // If fundraising for a business, send the campaign request immediately
      if (!isEdit && type === "CHARITY" && created.data?.id) {
        const reqRes = await fetch(`/api/fundraisers/${created.data.id}/charity-request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ charity_username: businessHandle.trim().replace(/^@/, "") }),
        })
        if (!reqRes.ok) {
          const reqBody = (await reqRes.json()) as { message?: string }
          setError(reqBody.message ?? "Fundraiser created but could not send the campaign request — check the business handle")
          return
        }
      }

      router.push("/dashboard/fundraisers")
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
      {/* Type */}
      {!isEdit && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Fundraiser type</Label>
          <div className="flex gap-3">
            {(["PERSONAL", "CHARITY"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={[
                  "flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors",
                  type === t ? "border-foreground bg-surface" : "border-border text-muted-foreground hover:border-foreground/40",
                ].join(" ")}
              >
                {t === "PERSONAL" ? "For myself" : "For a specific business"}
              </button>
            ))}
          </div>
          {type === "CHARITY" && (
            <div className="space-y-1.5 pt-1">
              <Label htmlFor="fr-business" className="text-sm font-medium">
                Business handle on Sub-tree <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input
                  id="fr-business"
                  value={businessHandle}
                  onChange={(e) => setBusinessHandle(e.target.value.replace(/^@/, ""))}
                  placeholder="businesshandle"
                  className="h-11 pl-7"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                The business will receive a campaign request and must approve before your fundraiser goes live.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="fr-title" className="text-sm font-medium">Title</Label>
        <Input
          id="fr-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Studio equipment fund"
          className="h-11"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="fr-desc" className="text-sm font-medium">Description</Label>
        <Textarea
          id="fr-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell donors what this campaign is for and why it matters…"
          rows={4}
          required
        />
      </div>

      {/* Goal */}
      <div className="space-y-1.5">
        <Label htmlFor="fr-goal" className="text-sm font-medium">Goal amount (UGX)</Label>
        <Input
          id="fr-goal"
          type="number"
          min={1000}
          step={1000}
          value={goalAmount}
          onChange={(e) => setGoalAmount(e.target.value)}
          placeholder="2000000"
          className="h-11 font-mono"
          required
        />
      </div>

      {/* Deadline */}
      <div className="space-y-1.5">
        <Label htmlFor="fr-deadline" className="text-sm font-medium">Deadline <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input
          id="fr-deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="h-11"
        />
      </div>

      {/* Cover image URL */}
      <div className="space-y-1.5">
        <Label htmlFor="fr-cover" className="text-sm font-medium">Cover image URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Input
          id="fr-cover"
          type="url"
          value={coverUrl}
          onChange={(e) => setCoverUrl(e.target.value)}
          placeholder="https://…"
          className="h-11 font-mono text-sm"
        />
      </div>

      {/* Show progress toggle */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Show progress bar</p>
          <p className="text-xs text-muted-foreground">Displays raised vs goal on your profile</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showProgress}
          onClick={() => setShowProgress((p) => !p)}
          className={[
            "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors",
            showProgress ? "bg-primary" : "bg-muted",
          ].join(" ")}
        >
          <span className={["pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform", showProgress ? "translate-x-5" : "translate-x-0"].join(" ")} />
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-1">
        <Button type="submit" disabled={saving} className="h-11 flex-1">
          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create fundraiser"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-11"
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
