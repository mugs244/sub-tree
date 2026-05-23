"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const SOCIAL_OPTIONS = [
  "YouTube",
  "Instagram",
  "TikTok",
  "X / Twitter",
  "Facebook",
  "Spotify",
  "Twitch",
  "LinkedIn",
]

const FEATURE_OPTIONS = [
  "Donation splits",
  "Shared dashboard",
  "Custom domain",
  "Advanced analytics",
  "Priority support",
  "Branded link page",
  "Team management",
  "API access",
]

interface Member {
  name: string
  phone: string
  email: string
  share_rate: string
}

const BLANK_MEMBER: Member = { name: "", phone: "", email: "", share_rate: "" }

type FieldErrors = Partial<Record<string, string>>

function memberKey(field: keyof Member, i: number) {
  return `member_${i}_${field}`
}

export function ContentHouseForm() {
  const router = useRouter()
  const [companyEmail, setCompanyEmail] = useState("")
  const [socials, setSocials] = useState<string[]>([])
  const [features, setFeatures] = useState<string[]>([])
  const [notes, setNotes] = useState("")
  const [members, setMembers] = useState<Member[]>([{ ...BLANK_MEMBER }, { ...BLANK_MEMBER }])
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  function toggleSet<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]
  }

  function updateMember(i: number, field: keyof Member, value: string) {
    setMembers((prev) => prev.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)))
  }

  function addMember() {
    if (members.length < 10) setMembers((prev) => [...prev, { ...BLANK_MEMBER }])
  }

  function removeMember(i: number) {
    if (members.length <= 2) return
    setMembers((prev) => prev.filter((_, idx) => idx !== i))
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {}

    if (!companyEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyEmail.trim())) {
      next.company_email = "Valid company email required"
    }
    if (socials.length === 0) next.socials = "Select at least one platform"
    if (features.length === 0) next.features = "Select at least one feature"

    const total = members.reduce((sum, m) => {
      const v = parseFloat(m.share_rate)
      return sum + (isNaN(v) ? 0 : v)
    }, 0)

    members.forEach((m, i) => {
      if (!m.name.trim()) next[memberKey("name", i)] = "Required"
      if (!/^0[0-9]{9}$/.test(m.phone.replace(/\s/g, "")))
        next[memberKey("phone", i)] = "Use format 07XXXXXXXX"
      if (!m.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m.email.trim()))
        next[memberKey("email", i)] = "Valid email required"
      const rate = parseFloat(m.share_rate)
      if (isNaN(rate) || rate <= 0 || rate > 100)
        next[memberKey("share_rate", i)] = "Enter a % between 1 and 100"
    })

    if (Object.keys(next).filter((k) => !k.startsWith("member_")).length === 0) {
      if (Math.round(total) !== 100) {
        next.share_total = `Share rates must sum to 100% (currently ${total.toFixed(1)}%)`
      }
    }

    return next
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    setServerError(null)
    try {
      const res = await fetch("/api/content-house", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_email: companyEmail.trim(),
          social_platforms: socials,
          features_requested: features,
          notes: notes.trim() || undefined,
          members: members.map((m) => ({
            name: m.name.trim(),
            phone: m.phone.replace(/\s/g, ""),
            email: m.email.trim(),
            share_rate: parseFloat(m.share_rate),
          })),
        }),
      })

      if (!res.ok) {
        const body = (await res.json()) as { error: unknown }
        setServerError("Something went wrong — please check your details and try again")
        console.error("Content house form error", body.error)
        return
      }

      setSubmitted(true)
    } catch {
      setServerError("Could not submit — please try again")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-4 py-4 text-center">
        <p className="text-2xl">💛</p>
        <h2 className="text-xl font-semibold">Request received</h2>
        <p className="text-[15px] text-[color:var(--text-secondary)]">
          We will review your application and reach out to all members within 24 hours.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/")}>
          Back to home
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Company email */}
      <div className="space-y-1.5">
        <Label htmlFor="company_email" className="text-sm font-medium">
          Company email <span className="text-[color:var(--state-error)]">*</span>
        </Label>
        <Input
          id="company_email"
          type="email"
          placeholder="studio@example.com"
          value={companyEmail}
          onChange={(e) => setCompanyEmail(e.target.value)}
          className={errors.company_email ? "border-[color:var(--state-error)]" : ""}
        />
        {errors.company_email && (
          <p className="text-xs text-[color:var(--state-error)]">{errors.company_email}</p>
        )}
      </div>

      {/* Social platforms */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Social platforms <span className="text-[color:var(--state-error)]">*</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {SOCIAL_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSocials((prev) => toggleSet(prev, s))}
              className={[
                "text-[13px] px-3 py-1.5 rounded-full border transition-colors",
                socials.includes(s)
                  ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                  : "border-[color:var(--border-default)] text-[color:var(--text-secondary)] hover:border-[color:var(--border-strong)]",
              ].join(" ")}
            >
              {s}
            </button>
          ))}
        </div>
        {errors.socials && (
          <p className="text-xs text-[color:var(--state-error)]">{errors.socials}</p>
        )}
      </div>

      {/* Feature requests */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          Features needed <span className="text-[color:var(--state-error)]">*</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {FEATURE_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFeatures((prev) => toggleSet(prev, f))}
              className={[
                "text-[13px] px-3 py-1.5 rounded-full border transition-colors",
                features.includes(f)
                  ? "border-[color:var(--accent)] bg-[color:var(--accent)]/10 text-[color:var(--accent)]"
                  : "border-[color:var(--border-default)] text-[color:var(--text-secondary)] hover:border-[color:var(--border-strong)]",
              ].join(" ")}
            >
              {f}
            </button>
          ))}
        </div>
        {errors.features && (
          <p className="text-xs text-[color:var(--state-error)]">{errors.features}</p>
        )}
      </div>

      {/* Members */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">
            Members ({members.length}) <span className="text-[color:var(--state-error)]">*</span>
          </Label>
          <p className="text-xs text-[color:var(--text-muted)]">
            Share rates must total 100%
          </p>
        </div>

        {errors.share_total && (
          <p className="text-xs text-[color:var(--state-error)]">{errors.share_total}</p>
        )}

        <div className="space-y-4">
          {members.map((m, i) => (
            <div
              key={i}
              className="rounded-lg border border-[color:var(--border-default)] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-[color:var(--text-secondary)]">
                  Member {i + 1}
                </span>
                {members.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeMember(i)}
                    className="text-[color:var(--text-muted)] hover:text-[color:var(--state-error)] transition-colors"
                    aria-label="Remove member"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Full name</Label>
                  <Input
                    placeholder="Jane Doe"
                    value={m.name}
                    onChange={(e) => updateMember(i, "name", e.target.value)}
                    className={errors[memberKey("name", i)] ? "border-[color:var(--state-error)]" : ""}
                  />
                  {errors[memberKey("name", i)] && (
                    <p className="text-xs text-[color:var(--state-error)]">{errors[memberKey("name", i)]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Phone (07XXXXXXXX)</Label>
                  <Input
                    placeholder="0700000000"
                    value={m.phone}
                    onChange={(e) => updateMember(i, "phone", e.target.value)}
                    className={errors[memberKey("phone", i)] ? "border-[color:var(--state-error)]" : ""}
                  />
                  {errors[memberKey("phone", i)] && (
                    <p className="text-xs text-[color:var(--state-error)]">{errors[memberKey("phone", i)]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Personal email</Label>
                  <Input
                    type="email"
                    placeholder="jane@example.com"
                    value={m.email}
                    onChange={(e) => updateMember(i, "email", e.target.value)}
                    className={errors[memberKey("email", i)] ? "border-[color:var(--state-error)]" : ""}
                  />
                  {errors[memberKey("email", i)] && (
                    <p className="text-xs text-[color:var(--state-error)]">{errors[memberKey("email", i)]}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Share rate (%)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    step="0.01"
                    placeholder="50"
                    value={m.share_rate}
                    onChange={(e) => updateMember(i, "share_rate", e.target.value)}
                    className={errors[memberKey("share_rate", i)] ? "border-[color:var(--state-error)]" : ""}
                  />
                  {errors[memberKey("share_rate", i)] && (
                    <p className="text-xs text-[color:var(--state-error)]">{errors[memberKey("share_rate", i)]}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {members.length < 10 && (
          <button
            type="button"
            onClick={addMember}
            className="flex items-center gap-1.5 text-[13px] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add another member
          </button>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes" className="text-sm font-medium">
          Notes <span className="text-[color:var(--text-muted)] font-normal">(optional)</span>
        </Label>
        <textarea
          id="notes"
          rows={3}
          placeholder="Anything else we should know about your studio…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-md border border-[color:var(--border-default)] bg-[color:var(--bg-surface)] px-3 py-2 text-sm placeholder:text-[color:var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/30 resize-none"
        />
      </div>

      {serverError && (
        <p className="text-xs text-[color:var(--state-error)]">{serverError}</p>
      )}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Submitting…
          </>
        ) : (
          "Submit application"
        )}
      </Button>
    </form>
  )
}
