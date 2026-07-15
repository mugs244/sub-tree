"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/brand/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, agreedToTerms }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "Something went wrong"); return }
    router.push(`/verify-email?userId=${data.userId}&email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[color:var(--bg-base)]">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <Logo variant="icon" />
          <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-[color:var(--text-secondary)]">Free to start — no credit card needed.</p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <div className="flex items-start gap-2">
            <Checkbox
              id="agreedToTerms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="agreedToTerms" className="text-sm font-normal leading-snug text-[color:var(--text-secondary)]">
              I agree to the{" "}
              <Link href="/terms" target="_blank" className="font-medium text-[color:var(--accent-primary)] hover:underline">
                Terms of Service
              </Link>
            </Label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading || !agreedToTerms}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-[color:var(--text-secondary)]">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-[color:var(--accent-primary)] hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
