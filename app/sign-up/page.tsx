"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/brand/Logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { SocialSignIn } from "@/components/auth/SocialSignIn"
import { PasswordChecklist } from "@/components/auth/PasswordChecklist"
import { passwordMeetsRules } from "@/lib/validators/password"

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const canSubmit = email.includes("@") && passwordMeetsRules(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    // Clicking "Create account" is the Terms agreement — the line beside the
    // button says so — and the server still logs it as before.
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, agreedToTerms: true }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error ?? "Something went wrong"); return }
    router.push(`/verify-email?userId=${data.userId}&email=${encodeURIComponent(email)}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-[color:var(--bg-base)]">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo variant="icon" />
          <h1 className="text-3xl font-semibold tracking-tight">Get started with your account</h1>
        </div>

        <p className="text-sm leading-relaxed text-[color:var(--text-secondary)]">
          Share your links and accept mobile money donations, all from one page.
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-[color:var(--accent-primary)] hover:underline">Sign in</Link>
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <PasswordChecklist password={password} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
            <Button type="submit" className="sm:w-40 shrink-0" disabled={loading || !canSubmit}>
              {loading ? "Creating…" : "Create account"}
            </Button>
            <p className="text-xs leading-relaxed text-[color:var(--text-secondary)]">
              By clicking &ldquo;Create account&rdquo;, you are creating a Sub-tree account and you agree to Sub-tree&apos;s{" "}
              <Link href="/terms" target="_blank" className="font-medium text-[color:var(--accent-primary)] hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/cookies" target="_blank" className="font-medium text-[color:var(--accent-primary)] hover:underline">Cookie Policy</Link>.
            </p>
          </div>
        </form>

        <SocialSignIn divider="above" termsNotice />
      </div>
    </div>
  )
}
