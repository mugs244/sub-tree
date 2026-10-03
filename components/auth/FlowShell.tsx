import Link from "next/link"
import { Logo } from "@/components/brand/Logo"

// The frame for every page after sign-up / sign-in — verify email,
// onboarding steps, forgot password — so the whole flow matches the auth
// pages: off-white canvas, rounded panel, logo, and the orange button style
// (globals.css .flow-shell styles the form inside).
export function FlowShell({
  title,
  subtitle,
  step,
  children,
}: {
  title: string
  subtitle?: React.ReactNode
  /** Onboarding progress, e.g. { current: 2, total: 3 }. */
  step?: { current: number; total: number }
  children: React.ReactNode
}) {
  return (
    <div className="flow-shell min-h-screen bg-[color:var(--landing-bg)] p-3 sm:p-6">
      <main className="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-xl flex-col rounded-[28px] bg-[color:var(--landing-panel)] p-5 sm:min-h-[calc(100vh-3rem)] sm:p-10">
        <header className="flex items-center justify-between gap-3">
          <Link href="/" aria-label="Sub-tree home">
            <Logo variant="lockup" />
          </Link>
          {step && (
            <span className="rounded-full border-2 border-foreground bg-white px-3 py-1 text-xs font-semibold">
              Step {step.current} of {step.total}
            </span>
          )}
        </header>

        {step && (
          <div className="mt-5 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: step.total }, (_, i) => (
              <span
                key={i}
                className={["h-1.5 flex-1 rounded-full", i < step.current ? "bg-[color:var(--landing-orange)]" : "bg-foreground/10"].join(" ")}
              />
            ))}
          </div>
        )}

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm space-y-7">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {subtitle && <p className="text-[15px] leading-relaxed text-muted-foreground">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
