"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type FieldErrors = Partial<Record<"display_name" | "bio" | "avatar_url", string>>

export function ProfileForm() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setServerError(null)

    const next: FieldErrors = {}
    if (!displayName.trim()) next.display_name = "Display name is required"
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/onboarding/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          bio: bio.trim() || undefined,
          avatar_url: avatarUrl.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const body = (await res.json()) as { error: string; message: string }
        setServerError(body.message ?? "Something went wrong")
        return
      }

      router.push("/onboarding/links")
    } catch {
      setServerError("Could not save profile — please try again")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="display_name" className="text-sm font-medium">
          Display name <span className="text-[color:var(--state-error)]">*</span>
        </Label>
        <Input
          id="display_name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={errors.display_name ? "border-[color:var(--state-error)] focus-visible:ring-[color:var(--state-error)]/20" : ""}
        />
        <div className="min-h-[18px]">
          {errors.display_name && (
            <p className="text-xs text-[color:var(--state-error)]">{errors.display_name}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio" className="text-sm font-medium">
          Bio <span className="text-[color:var(--text-muted)] font-normal">(optional)</span>
        </Label>
        <Textarea
          id="bio"
          placeholder="Tell people a little about yourself…"
          rows={3}
          maxLength={300}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="resize-none"
        />
        <p className="text-xs text-[color:var(--text-muted)] text-right">{bio.length}/300</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="avatar_url" className="text-sm font-medium">
          Avatar URL <span className="text-[color:var(--text-muted)] font-normal">(optional)</span>
        </Label>
        <Input
          id="avatar_url"
          type="url"
          placeholder="https://…"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className={errors.avatar_url ? "border-[color:var(--state-error)] focus-visible:ring-[color:var(--state-error)]/20" : ""}
        />
        {errors.avatar_url && (
          <p className="text-xs text-[color:var(--state-error)]">{errors.avatar_url}</p>
        )}
      </div>

      {serverError && (
        <p className="text-xs text-[color:var(--state-error)]">{serverError}</p>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Saving…
          </>
        ) : (
          "Continue"
        )}
      </Button>
    </form>
  )
}
