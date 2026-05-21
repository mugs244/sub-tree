import Link from "next/link"
import { Logo } from "@/components/brand/Logo"
import { Link2, Heart, BarChart2, ArrowRight, Globe, Smartphone } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" aria-label="Sub-tree home">
            <Logo variant="lockup" />
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:bg-accent-dark transition-colors duration-150"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="flex flex-col md:flex-row md:items-center gap-12 md:gap-16">
            {/* Left */}
            <div className="flex-1 md:max-w-[52%]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
                <Globe className="h-3 w-3" />
                Built for East African creators
              </span>
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] mb-5">
                All your links.<br />
                One page.
              </h1>
              <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-md">
                Share everything you create — links, content, social profiles — and accept mobile money donations directly, all from a single Sub-tree link.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-accent-dark transition-colors duration-150"
                >
                  Claim your username
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-surface transition-colors duration-150"
                >
                  Sign in
                </Link>
              </div>
            </div>

            {/* Right — profile preview mockup */}
            <div className="flex-1 flex justify-center md:justify-end">
              <ProfileMockup />
            </div>
          </div>
        </section>

        {/* ── Stats strip ─────────────────────────────────── */}
        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 grid grid-cols-3 gap-6 text-center">
            <StatItem value="Free" label="to get started" />
            <StatItem value="MTN + Airtel" label="mobile money" />
            <StatItem value="1 link" label="for everything" />
          </div>
        </section>

        {/* ── Features ────────────────────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
              Everything a creator needs
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              One link that does the work of a website, social profile, and payment page.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <FeatureCard
              icon={Link2}
              title="All your links, one place"
              body="Add unlimited links, reorder them in seconds, and choose a button style that fits your brand."
            />
            <FeatureCard
              icon={Heart}
              title="Accept mobile money"
              body="Let supporters send donations straight to your MTN MoMo or Airtel Money number — no bank account needed."
            />
            <FeatureCard
              icon={BarChart2}
              title="Know your audience"
              body="See how many people visit your page, which links they click, and where your donations come from."
            />
          </div>
        </section>

        {/* ── How it works ────────────────────────────────── */}
        <section className="bg-surface border-t border-border">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center mb-14">
              Up in three steps
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
              <Step
                number={1}
                title="Claim your @username"
                body="Pick a unique username — your Sub-tree link will be sub-tree.com/you."
                connector
              />
              <Step
                number={2}
                title="Add your links"
                body="Paste in your Instagram, YouTube, WhatsApp, website — anything you want to share."
                connector
              />
              <Step
                number={3}
                title="Share everywhere"
                body="One link in your bio does it all. Supporters can send you money while they're there."
                connector={false}
              />
            </div>
          </div>
        </section>

        {/* ── Mobile money highlight ───────────────────────── */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
          <div className="rounded-2xl border border-border bg-surface p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-8">
            <div className="flex-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground mb-4">
                <Smartphone className="h-3 w-3" />
                Mobile money built in
              </span>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
                Get paid on MTN MoMo<br className="hidden sm:block" /> and Airtel Money
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                Your supporters enter their phone number and approve the payment from their mobile. Donations go directly to your registered MoMo number — no bank, no delay, no middleman.
              </p>
            </div>
            <div className="shrink-0">
              <DonatePreview />
            </div>
          </div>
        </section>

        {/* ── CTA banner ──────────────────────────────────── */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
              Ready to grow your audience?
            </h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
              Create your Sub-tree page in minutes. Free to start, no credit card required.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-accent-dark transition-colors duration-150"
            >
              Get started — it&apos;s free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <Logo variant="lockup" />
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/sign-up" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
              Sign up
            </Link>
            <Link href="/sign-in" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
              Sign in
            </Link>
            <a href="mailto:hello@sub-tree.com" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
              Contact
            </a>
          </nav>
          <p className="text-xs text-muted-foreground sm:text-right">
            &copy; {new Date().getFullYear()} Sub-tree
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────── */

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-lg font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ElementType
  title: string
  body: string
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-6 flex flex-col gap-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-surface">
        <Icon className="h-5 w-5 text-foreground" strokeWidth={1.5} />
      </span>
      <div>
        <h3 className="text-sm font-semibold mb-1.5">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </div>
  )
}

function Step({
  number,
  title,
  body,
  connector,
}: {
  number: number
  title: string
  body: string
  connector?: boolean
}) {
  return (
    <div className="relative flex flex-col gap-3 px-0 sm:px-6 pb-10 sm:pb-0 first:pl-0">
      {/* horizontal connector line on desktop */}
      {connector && (
        <span className="hidden sm:block absolute top-4 left-[calc(50%+1.5rem)] right-0 h-px bg-border" />
      )}
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold font-mono z-10">
        {number}
      </span>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </div>
  )
}

function ProfileMockup() {
  return (
    <div className="w-[260px] rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
      {/* header bar */}
      <div className="h-2 bg-surface border-b border-border" />
      <div className="px-5 py-6 space-y-4">
        {/* avatar + name */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-semibold">
            A
          </div>
          <div>
            <p className="text-sm font-semibold">Amara Naledi</p>
            <p className="text-[10px] text-muted-foreground font-mono">@amara</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Content creator · Kampala</p>
          </div>
        </div>

        {/* links */}
        <div className="space-y-2">
          {["YouTube Channel", "Instagram", "WhatsApp"].map((label) => (
            <div
              key={label}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-center"
            >
              {label}
            </div>
          ))}
        </div>

        {/* donate button */}
        <div className="w-full rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-medium text-center">
          Support Amara
        </div>

        {/* powered by */}
        <p className="text-center text-[9px] text-muted-foreground">
          Powered by Sub-tree
        </p>
      </div>
    </div>
  )
}

function DonatePreview() {
  return (
    <div className="w-[220px] rounded-xl border border-border bg-background p-5 space-y-3">
      <p className="text-xs font-medium">Amount (UGX)</p>
      <div className="grid grid-cols-3 gap-1.5">
        {["2,000", "5,000", "10,000"].map((a, i) => (
          <div
            key={a}
            className={[
              "py-1.5 text-[10px] font-medium rounded-lg border text-center",
              i === 1
                ? "border-foreground bg-foreground text-background"
                : "border-border",
            ].join(" ")}
          >
            {a}
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] text-muted-foreground">Mobile money number</p>
        <div className="rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-mono text-muted-foreground">
          07XX XXX XXX
        </div>
      </div>
      <div className="w-full rounded-lg bg-primary text-primary-foreground py-2 text-[10px] font-medium text-center">
        Donate UGX 5,000
      </div>
      <p className="text-center text-[9px] text-muted-foreground">
        MTN MoMo · Airtel Money
      </p>
    </div>
  )
}
