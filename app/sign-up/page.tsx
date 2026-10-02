"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { SocialSignIn } from "@/components/auth/SocialSignIn"
import { PasswordChecklist } from "@/components/auth/PasswordChecklist"
import { AuthShell, authButtonClass, authInputClass } from "@/components/auth/AuthShell"
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
    // Clicking "Create account" is the Terms agreement — the line under the
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
    <AuthShell variant="sign-up">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter">Get started with your account</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">Sign in</Link>
      </p>

      <div className="mt-7">
        <SocialSignIn action="Sign up" termsNotice />
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-3 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={authInputClass} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={authInputClass} />
          <PasswordChecklist password={password} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className={authButtonClass} disabled={loading || !canSubmit}>
          {loading ? "Creating…" : "Create account"}
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          By clicking &ldquo;Create account&rdquo;, you are creating a Sub-tree account and you agree to Sub-tree&apos;s{" "}
          <Link href="/terms" target="_blank" className="font-medium text-foreground hover:underline">Terms of Service</Link>
          , acknowledge the{" "}
          <Link href="/privacy" target="_blank" className="font-medium text-foreground hover:underline">Privacy Policy</Link>
          {" "}and agree to the{" "}
          <Link href="/cookies" target="_blank" className="font-medium text-foreground hover:underline">Cookie Policy</Link>.
        </p>
      </form>
    </AuthShell>
  )
}
