import Link from "next/link"
import { Sparkle } from "lucide-react"
import { Logo } from "@/components/brand/Logo"
import { PlatformIcon } from "@/components/PlatformIcon"
import { ProfileMockup } from "@/components/marketing/ProfileMockup"
import type { Platform } from "@/lib/utils/platform"

// Shared look for the auth forms, in the landing page's style: chunky
// bordered inputs and an orange pressable primary button.
export const authInputClass = "h-11 rounded-xl border-2 border-border bg-white focus-visible:border-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
export const authButtonClass =
  "landing-cta h-12 w-full rounded-full border-2 border-foreground bg-[color:var(--landing-orange)] text-[15px] font-semibold text-foreground hover:bg-[color:var(--landing-orange)] disabled:opacity-60"
export const authLinkButtonClass =
  "w-full text-sm text-center text-muted-foreground hover:text-foreground transition-colors"

type Variant = "sign-in" | "sign-up"

const TILES: { platform: Platform; cls: string }[] = [
  { platform: "youtube",   cls: "right-[12%] top-[14%] h-14 w-14 rotate-[12deg]" },
  { platform: "instagram", cls: "right-[30%] top-[6%] h-11 w-11 rotate-[-10deg]" },
  { platform: "whatsapp",  cls: "right-[8%] top-[34%] h-10 w-10 rotate-[-6deg]" },
]

// Split layout: a brand panel on the left (desktop only) and the form panel
// on the right, both on the landing page's off-white canvas.
export function AuthShell({ variant, children }: { variant: Variant; children: React.ReactNode }) {
  const isSignUp = variant === "sign-up"
  return (
    <div className="min-h-screen bg-[color:var(--landing-bg)] p-3 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-6xl grid-cols-1 gap-3 sm:min-h-[calc(100vh-3rem)] lg:grid-cols-2">
        <aside
          className={[
            "relative hidden flex-col overflow-hidden rounded-[28px] p-10 lg:flex",
            isSignUp ? "bg-[color:var(--landing-orange)] text-foreground" : "bg-foreground text-background",
          ].join(" ")}
        >
          {TILES.map(({ platform, cls }) => (
            <span
              key={platform}
              aria-hidden="true"
              className={[
                "landing-tile absolute flex items-center justify-center rounded-2xl border-2 border-foreground",
                isSignUp ? "bg-white text-foreground" : "bg-[color:var(--landing-orange)] text-foreground",
                cls,
              ].join(" ")}
            >
              <PlatformIcon platform={platform} className="h-1/2 w-1/2" />
            </span>
          ))}
          <Sparkle className="absolute right-[24%] top-[30%] h-4 w-4 opacity-60" strokeWidth={1.5} aria-hidden="true" />

          {/* What they're signing up for / coming back to */}
          <div className="flex flex-1 items-center pb-8 text-foreground" aria-hidden="true">
            <div className="w-[220px] rotate-[-4deg] rounded-2xl border-2 border-foreground landing-tile">
              <ProfileMockup />
            </div>
          </div>

          <div>
            <span
              className={[
                "rounded-md border px-2 py-0.5 text-[11px] font-medium",
                isSignUp ? "border-foreground" : "border-white/60",
              ].join(" ")}
            >
              {isSignUp ? "Free to sign up" : "Welcome back"}
            </span>
            <h2 className="mt-4 text-5xl font-bold leading-[0.95] tracking-tighter">
              {isSignUp ? (
                <>All your links.<br />One page.</>
              ) : (
                <>Good to see<br />you again.</>
              )}
            </h2>
            <p className={["mt-4 max-w-sm text-sm", isSignUp ? "text-foreground/75" : "text-white/70"].join(" ")}>
              {isSignUp
                ? "Share everything you create and accept mobile money donations, all from one link."
                : "Your page, your links and your supporters are right where you left them."}
            </p>
            <ul className="mt-8 grid grid-cols-3 gap-2">
              {(isSignUp
                ? ["Claim your @username", "Add your links", "Share everywhere"]
                : ["Edit your links", "See your analytics", "Withdraw to MoMo"]
              ).map((s, i) => (
                <li
                  key={s}
                  className={[
                    "rounded-xl border-2 px-3 py-2.5 text-xs font-medium",
                    isSignUp ? "border-foreground bg-white/80" : "border-white/20 bg-white/10",
                  ].join(" ")}
                >
                  <span className="mb-1 block font-mono text-[11px] font-bold opacity-60">0{i + 1}</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="flex flex-col rounded-[28px] bg-[color:var(--landing-panel)] p-5 sm:p-10">
          <header className="flex items-center justify-between gap-3">
            <Link href="/" aria-label="Sub-tree home">
              <Logo variant="lockup" />
            </Link>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="hidden sm:inline">{isSignUp ? "Have an account?" : "New here?"}</span>
              <Link
                href={isSignUp ? "/sign-in" : "/sign-up"}
                className="inline-flex items-center rounded-md border border-border bg-white px-3 py-1.5 font-medium text-foreground hover:bg-surface transition-colors duration-150"
              >
                {isSignUp ? "Sign in" : "Sign up"}
              </Link>
            </p>
          </header>
          <div className="flex flex-1 items-center justify-center py-10">
            <div className="w-full max-w-sm">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
