import Link from "next/link"
import { Logo } from "@/components/brand/Logo"
import { Link2, Heart, BarChart2, ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" aria-label="Sub-tree home">
            <Logo variant="lockup" />
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-accent-dark transition-colors"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 pt-20 pb-24 text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
            Built for East African creators
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
            All your links.<br />
            One page.
          </h1>
          <p className="mx-auto max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed mb-10">
            Share everything you create — links, content, social profiles — and accept mobile money donations, all from a single Sub-tree link.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-accent-dark transition-colors"
            >
              Claim your username
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-surface transition-colors"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* Feature strip */}
        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-16 grid grid-cols-1 sm:grid-cols-3 gap-10">
            <Feature
              icon={Link2}
              title="All your links, one place"
              body="Add unlimited links, reorder them in seconds, and choose a button style that matches your brand."
            />
            <Feature
              icon={Heart}
              title="Accept mobile money"
              body="Let supporters send donations straight to your MTN MoMo or Airtel Money number — no bank account needed."
            />
            <Feature
              icon={BarChart2}
              title="Know your audience"
              body="See how many people visit your page and click your links. Simple analytics, no setup required."
            />
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-14">
            Up in three steps
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <Step number={1} title="Claim your @username" body="Pick a unique username — your Sub-tree link will be sub-tree.com/you." />
            <Step number={2} title="Add your links" body="Paste in your Instagram, YouTube, WhatsApp, website — anything you want to share." />
            <Step number={3} title="Share everywhere" body="One link in your bio does it all. Supporters can even send you money while they're there." />
          </div>
        </section>

        {/* CTA banner */}
        <section className="border-t border-border bg-surface">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">
              Ready to grow your audience?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              Join creators across East Africa using Sub-tree to connect with their audience.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-accent-dark transition-colors"
            >
              Get started — it&apos;s free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Logo variant="lockup" />
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Sub-tree
          </p>
        </div>
      </footer>
    </div>
  )
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ElementType
  title: string
  body: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-background">
        <Icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  )
}

function Step({
  number,
  title,
  body,
}: {
  number: number
  title: string
  body: string
}) {
  return (
    <div className="flex flex-col gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-xs font-semibold font-mono">
        {number}
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  )
}
