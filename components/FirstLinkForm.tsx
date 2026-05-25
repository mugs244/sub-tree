"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type FieldErrors = Partial<Record<"url" | "label", string>>

export function FirstLinkForm() {
  const router = useRouter()
  const [url, setUrl] = useState("")
  const [label, setLabel] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErrors({})
    setServerError(null)

    const next: FieldErrors = {}
    if (!url.trim()) next.url = "URL is required"
    if (!label.trim()) next.label = "Label is required"
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/onboarding/add-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), label: label.trim() }),
      })

      if (!res.ok) {
        const body = (await res.json()) as { error: string; message: string }
        setServerError(body.message ?? "Something went wrong")
        return
      }

      // TODO: restore plan gate — change back to router.push("/onboarding/plan") before launch
      router.push("/dashboard")
    } catch {
      setServerError("Could not add link — please try again")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="link_url" className="text-sm font-medium">
          URL <span className="text-[color:var(--state-error)]">*</span>
        </Label>
        <Input
          id="link_url"
          type="url"
          placeholder="https://…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={errors.url ? "border-[color:var(--state-error)] focus-visible:ring-[color:var(--state-error)]/20" : ""}
        />
        <div className="min-h-[18px]">
          {errors.url && (
            <p className="text-xs text-[color:var(--state-error)]">{errors.url}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="link_label" className="text-sm font-medium">
          Label <span className="text-[color:var(--state-error)]">*</span>
        </Label>
        <Input
          id="link_label"
          type="text"
          placeholder="My website"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className={errors.label ? "border-[color:var(--state-error)] focus-visible:ring-[color:var(--state-error)]/20" : ""}
        />
        <div className="min-h-[18px]">
          {errors.label && (
            <p className="text-xs text-[color:var(--state-error)]">{errors.label}</p>
          )}
        </div>
      </div>

      {serverError && (
        <p className="text-xs text-[color:var(--state-error)]">{serverError}</p>
      )}

      <div className="flex flex-col gap-3">
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Adding…
            </>
          ) : (
            "Add link"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-[color:var(--text-muted)]"
          disabled={submitting}
          onClick={() => router.push("/onboarding/plan")}
        >
          Skip for now
        </Button>
      </div>

      <p className="text-xs text-center text-[color:var(--text-muted)]">
        You can add and manage more links from your dashboard.
      </p>
    </form>
  )
}
