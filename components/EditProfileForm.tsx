"use client"

import { useState, useEffect, useRef } from "react"
import { Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface EditProfileFormProps {
  initialDisplayName: string
  initialBio: string
  initialAvatarUrl: string
  initialMomoNumber: string
}

export function EditProfileForm({
  initialDisplayName,
  initialBio,
  initialAvatarUrl,
  initialMomoNumber,
}: EditProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [bio, setBio] = useState(initialBio)
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [momoNumber, setMomoNumber] = useState(initialMomoNumber)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!displayName.trim()) { setError("Display name is required"); return }
    navigator?.vibrate?.(20)
    setSaving(true)
    setSaved(false)
    setError(null)
    try {
      const res = await fetch("/api/onboarding/save-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          bio: bio.trim() || undefined,
          avatar_url: avatarUrl.trim() || undefined,
          momo_number: momoNumber.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const body = (await res.json()) as { message?: string }
        setError(body.message ?? "Could not save profile")
        return
      }
      setSaved(true)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setSaved(false), 2000)
    } catch {
      setError("Could not save — please try again")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="edit-display-name" className="text-sm font-medium">
          Display name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="edit-display-name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={80}
          placeholder="Your name"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-bio" className="text-sm font-medium">
          Bio <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="edit-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="Tell people a little about yourself…"
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">{bio.length}/300</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-avatar" className="text-sm font-medium">
          Avatar URL <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          id="edit-avatar"
          type="url"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://…"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="edit-momo" className="text-sm font-medium">
          Donation number <span className="text-muted-foreground font-normal">(MTN or Airtel)</span>
        </Label>
        <Input
          id="edit-momo"
          type="tel"
          value={momoNumber}
          onChange={(e) => setMomoNumber(e.target.value)}
          placeholder="0771234567"
        />
        <p className="text-xs text-muted-foreground">
          Donations from supporters will be sent to this number.
        </p>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <Button type="submit" disabled={saving} className="w-full sm:w-auto">
        {saving ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
        ) : saved ? (
          <><Check className="h-4 w-4 mr-2" />Saved</>
        ) : (
          "Save profile"
        )}
      </Button>
    </form>
  )
}
