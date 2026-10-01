"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createSupabaseBrowserClient, getSupabaseConfig } from "@/lib/supabase/client"

type Provider = "google" | "apple"

// NEXT_PUBLIC_* values are inlined at build time. Without the Supabase keys the
// buttons still show, but explain that this option isn't live yet instead of
// failing.
const { url: supabaseUrl, key: supabaseKey } = getSupabaseConfig()
const CONFIGURED = Boolean(supabaseUrl && supabaseKey)

// Hidden until Sign in with Apple is set up in Supabase (needs a paid Apple
// Developer account). Flip to true once the Apple provider is enabled there.
const APPLE_ENABLED = false

export function SocialSignIn({
  next,
  disabled = false,
  termsNotice = false,
  divider = "below",
  action = "Continue",
}: {
  next?: string | null
  disabled?: boolean
  // A first Google/Apple login creates an account, so the pages show this
  // notice to make that a Terms agreement.
  termsNotice?: boolean
  // Which side of the buttons the "or" separator goes on, relative to the
  // email form they sit beside.
  divider?: "above" | "below"
  // Button wording: "Sign up with Google" on sign-up, "Sign in with…" on sign-in.
  action?: "Continue" | "Sign in" | "Sign up"
}) {
  const [pending, setPending] = useState<Provider | null>(null)
  const [error, setError] = useState("")

  async function start(provider: Provider) {
    setError("")
    if (!CONFIGURED) {
      setError("Google sign-in is coming soon. Please use your email for now.")
      return
    }
    setPending(provider)
    const callback = new URL("/auth/callback", window.location.origin)
    if (next) callback.searchParams.set("next", next)
    const { error } = await createSupabaseBrowserClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: callback.toString() },
    })
    // On success the browser is already navigating to the provider.
    if (error) {
      setPending(null)
      setError("Couldn't start sign-in. Please try again.")
    }
  }

  return (
    <div className="space-y-3">
      {divider === "above" && <OrDivider />}
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full gap-2 rounded-xl border-2 border-foreground bg-white font-semibold hover:bg-surface"
        disabled={disabled || pending !== null}
        onClick={() => void start("google")}
      >
        <GoogleIcon />
        {pending === "google" ? "Redirecting…" : `${action} with Google`}
      </Button>
      {APPLE_ENABLED && (
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full gap-2 rounded-xl border-2 border-foreground bg-white font-semibold hover:bg-surface"
          disabled={disabled || pending !== null}
          onClick={() => void start("apple")}
        >
          <AppleIcon />
          {pending === "apple" ? "Redirecting…" : `${action} with Apple`}
        </Button>
      )}
      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
      {termsNotice && (
        <p className="text-xs text-center text-[color:var(--text-secondary)]">
          By continuing with {APPLE_ENABLED ? "Google or Apple" : "Google"} (which creates an account if you&apos;re new), you agree to Sub-tree&apos;s{" "}
          <Link href="/terms" target="_blank" className="font-medium text-[color:var(--accent-primary)] hover:underline">
            Terms of Service
          </Link>
          .
        </p>
      )}
      {divider === "below" && <OrDivider />}
    </div>
  )
}

function OrDivider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-[color:var(--border-default)]" />
      <span className="text-xs text-[color:var(--text-secondary)]">or</span>
      <span className="h-px flex-1 bg-[color:var(--border-default)]" />
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M16.37 12.64c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.97.9-3.76 2.28-1.61 2.79-.41 6.91 1.15 9.17.77 1.1 1.68 2.34 2.87 2.3 1.16-.05 1.59-.74 2.99-.74 1.39 0 1.79.74 3 .72 1.24-.02 2.02-1.12 2.78-2.23.88-1.28 1.24-2.52 1.26-2.59-.03-.01-2.42-.93-2.45-3.69zM14.1 5.9c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.67-1.1 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.27z" />
    </svg>
  )
}
