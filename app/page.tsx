import Link from "next/link"
import { Logo } from "@/components/brand/Logo"
import { PlatformIcon } from "@/components/PlatformIcon"
import { DonationLaunchNotice } from "@/components/DonationLaunchNotice"
import { CookiePreferencesButton } from "@/components/CookiePreferencesButton"
import { Link2, Heart, BarChart2, ArrowRight, Smartphone, Check, Minus, Sparkle } from "lucide-react"
import type { Platform } from "@/lib/utils/platform"
import { getFeeRate } from "@/lib/services/platform-settings"

// ── Hero floating tiles ──────────────────────────────────
// Placed around the headline like scattered stickers; desktop only.
const FLOATING_TILES: { platform: Platform; cls: string; tone: "dark" | "light" | "orange" }[] = [
  { platform: "youtube",   cls: "left-[11%] top-[24%] h-14 w-14 rotate-[-14deg]", tone: "dark" },
  { platform: "instagram", cls: "left-[17%] top-[46%] h-12 w-12 rotate-[10deg]",  tone: "orange" },
  { platform: "whatsapp",  cls: "right-[15%] top-[48%] h-11 w-11 rotate-[-8deg]", tone: "light" },
  { platform: "tiktok",    cls: "right-[20%] top-[16%] h-10 w-10 rotate-[8deg]",  tone: "light" },
]
const SPARKLES = ["left-[22%] top-[30%]", "left-[13%] top-[60%]", "right-[25%] top-[38%]", "right-[11%] top-[60%]"]

// ── Logo bar ─────────────────────────────────────────────
const LOGO_BAR_NAMES = [
  { name: "Kampala Eats",  cls: "font-serif" },
  { name: "BORN HERE",    cls: "font-mono font-bold tracking-[0.18em] uppercase text-[11px]" },
  { name: "rolex daily",  cls: "italic font-light" },
  { name: "Mama Asha",    cls: "italic font-medium" },
  { name: "Naks FM",      cls: "font-bold tracking-tight" },
  { name: "OliMu",        cls: "tracking-tighter font-semibold" },
]

// ── Testimonials ─────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "I used to send five different links to anyone who asked. Now there’s just one. My MoMo number stays private and the money still lands.",
    name: "Amara Naledi",
    role: "Food creator · Kampala",
    handle: "@amara",
    initial: "A",
  },
  {
    quote: "Setting up took ten minutes. Now my audience can find everything from one link and support me without needing a bank card.",
    name: "Joel Mukasa",
    role: "Musician · Kampala",
    handle: "@joelm",
    initial: "J",
  },
  {
    quote: "We run a small youth choir. Sub-tree gave us one page for the schedule, the donate button, and a way for the community to find us — all in shillings.",
    name: "St. Andrew’s Voices",
    role: "Choir · Entebbe",
    handle: "@standrews",
    initial: "S",
  },
]

// ── Pricing tiers ─────────────────────────────────────────
type FeatureValue = string | boolean

interface Tier {
  id: string
  name: string
  blurb: string
  price: number | null
  cta: string
  href: string
  highlight: boolean
  features: { label: string; value: FeatureValue }[]
}

function buildTiers(donationFeePct: string, withdrawalFeePct: string): Tier[] {
  return [
    {
      id: "free",
      name: "Free",
      blurb: "All your links, one page — forever free.",
      price: null,
      cta: "Get started",
      href: "/sign-up",
      highlight: true,
      features: [
        { label: "Donation fee",      value: donationFeePct },
        { label: "Withdrawal fee",    value: withdrawalFeePct },
        { label: "Themes",            value: "5 presets" },
        { label: "Links",             value: "Unlimited" },
        { label: "Analytics",         value: "Page views + clicks" },
        { label: "Mobile money",      value: "MTN + Airtel" },
        { label: "Members",           value: "1" },
      ],
    },
  ]
}

function formatPct(rate: number): string {
  // Round first: 0.2 + 0.01 is 0.21000000000000002, which would otherwise
  // show as "21.0%".
  const pct = Math.round(rate * 1000) / 10
  return `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`
}

export const metadata = {
  title: "Sub-tree — All your links, one page",
  description: "Share everything you create and accept mobile money donations, all from one link.",
  openGraph: {
    title: "Sub-tree — All your links, one page",
    description: "Share everything you create and accept mobile money donations, all from one link.",
  },
}

// Reads live fee rates from the DB — must not be statically prerendered at
// build time (build machines aren't guaranteed DB connectivity), and the
// rates shown here should reflect whatever an admin has configured right now.
export const dynamic = "force-dynamic"

export default async function LandingPage() {
  const [donationFeeRate, withdrawalCreatorRate, withdrawalProcessorRate] = await Promise.all([
    getFeeRate("fee_donation_free", 0.05),
    getFeeRate("fee_withdrawal_creator", 0.02),
    getFeeRate("fee_withdrawal_processor", 0.01),
  ])
  const donationFeePct = formatPct(donationFeeRate)
  const withdrawalFeePct = formatPct(withdrawalCreatorRate + withdrawalProcessorRate)
  const TIERS = buildTiers(donationFeePct, withdrawalFeePct)

  return (
    <div className="flex flex-col min-h-screen bg-[color:var(--landing-bg)] text-foreground">
      <main className="flex-1">
        {/* ── Hero panel ──────────────────────────────────── */}
        <section className="px-3 pt-3 sm:px-6 sm:pt-6">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-[color:var(--landing-panel)] px-4 pb-4 pt-4 sm:px-8 sm:pb-8 sm:pt-6">
            {/* Nav */}
            <header className="relative z-20 flex items-center justify-between">
              <Link href="/" aria-label="Sub-tree home">
                <Logo variant="lockup" />
              </Link>
              <nav className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium shadow-[0_1px_2px_0_rgb(0_0_0/0.06)] hover:bg-surface transition-colors duration-150"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden="true" />
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-accent-dark transition-colors duration-150"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--landing-orange)]" aria-hidden="true" />
                  Sign up
                </Link>
              </nav>
            </header>

            <div className="relative z-10 mt-6">
              <DonationLaunchNotice />
            </div>

            {/* Floating platform tiles — real Simple Icons, not drawn props */}
            <FloatingTiles />

            {/* Headline */}
            <div className="relative z-10 mx-auto max-w-3xl pt-12 pb-10 text-center sm:pt-16 sm:pb-14">
              <h1 className="text-[44px] leading-[0.95] sm:text-7xl font-bold tracking-tighter">
                All your{" "}
                <span className="relative inline-block">
                  links
                  <Squiggle />
                </span>
                .
                <br />
                <span className="relative inline-block">
                  One page.
                  <span className="absolute -bottom-7 right-0 sm:bottom-auto sm:-right-24 sm:top-1 rotate-[-6deg] rounded-md border border-foreground bg-white px-2 py-0.5 text-[10px] sm:text-xs font-semibold tracking-normal leading-tight shadow-[2px_2px_0_0_#111827]">
                    MoMo built in
                  </span>
                </span>
              </h1>
              <p className="mx-auto mt-10 sm:mt-5 max-w-md text-sm sm:text-[16px] text-muted-foreground">
                Share everything you create and accept mobile money donations, all from one link.
              </p>
              <div className="mt-8 flex justify-center">
                <span className="rounded-full border border-dashed border-border-default p-2">
                  <Link
                    href="/sign-up"
                    className="landing-cta inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-[color:var(--landing-orange)] px-7 py-3.5 text-[16px] sm:text-lg font-semibold text-foreground"
                  >
                    Sign up for free
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </span>
              </div>
            </div>

            {/* Cards */}
            <div className="relative z-10 grid grid-cols-1 gap-3 md:grid-cols-3">
              {/* Dark — mobile money */}
              <div className="relative flex min-h-[290px] flex-col overflow-hidden rounded-[20px] bg-foreground p-6 text-background">
                <CardTag dark>Mobile money</CardTag>
                <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight">Get paid on MoMo</h2>
                <p className="mt-2 text-sm text-white/70">
                  Supporters send money straight to your MTN or Airtel number.
                </p>
                <div className="mt-auto pt-6 grid grid-cols-3 gap-2">
                  {["2,000", "5,000", "10,000"].map((a, i) => (
                    <div
                      key={a}
                      className={[
                        "rounded-xl py-2.5 text-center font-mono text-xs",
                        i === 1 ? "bg-[color:var(--landing-orange)] text-foreground font-semibold" : "bg-white/10 text-white/80",
                      ].join(" ")}
                    >
                      UGX {a}
                    </div>
                  ))}
                </div>
              </div>

              {/* Light — the page itself */}
              <div className="relative flex min-h-[290px] flex-col overflow-hidden rounded-[20px] bg-[#ececea] p-6">
                <CardTag>Your page</CardTag>
                <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight">All your links, one page</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  YouTube, Instagram, WhatsApp and more behind one link in your bio.
                </p>
                <div className="pointer-events-none mt-auto -mb-6 flex h-[120px] justify-center overflow-hidden pt-5" aria-hidden="true">
                  <div className="w-[210px] rotate-[-3deg]">
                    <ProfileMockup />
                  </div>
                </div>
              </div>

              {/* Orange — live fees */}
              <div className="relative flex min-h-[290px] flex-col overflow-hidden rounded-[20px] bg-[color:var(--landing-orange)] p-6">
                <CardTag>Simple fees</CardTag>
                <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight">Free to sign up</h2>
                <p className="mt-2 text-sm text-foreground/75">
                  You only pay a small fee when money comes in or goes out.
                </p>
                <div className="mt-auto pt-6 grid grid-cols-2 gap-2">
                  <FeeChip label="Donation fee" value={donationFeePct} />
                  <FeeChip label="Withdrawal fee" value={withdrawalFeePct} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Logo bar ────────────────────────────────────── */}
        <section className="border-b border-border">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
            <p className="text-xs text-muted-foreground text-center mb-6">
              Trusted by creators and organisations across East Africa
            </p>
            <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
              {LOGO_BAR_NAMES.map(({ name, cls }) => (
                <li key={name} className={`text-sm text-muted-foreground ${cls}`}>
                  {name}
                </li>
              ))}
            </ul>
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
        <section>
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
          <div className="rounded-[28px] bg-[color:var(--landing-panel)] p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-8">
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

        {/* ── Testimonials ────────────────────────────────── */}
        <section>
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
                Quiet wins from real creators
              </h2>
              <p className="text-muted-foreground text-sm">Three early users, in their own words.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {TESTIMONIALS.map((t) => (
                <figure key={t.handle} className="rounded-xl border border-border bg-background p-6 flex flex-col gap-4">
                  <blockquote className="text-sm text-muted-foreground leading-relaxed flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      {t.initial}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-xs font-semibold">{t.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        <span className="font-mono">{t.handle}</span>
                        {" · "}{t.role}
                      </span>
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────── */}
        <section id="pricing" className="mx-auto max-w-5xl px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Everything you need to share your links and accept mobile money donations — at no cost.
            </p>
          </div>
          <div className="max-w-sm mx-auto w-full">
            {TIERS.map((tier) => (
              <PricingCard key={tier.id} tier={tier} />
            ))}
          </div>
          <p className="mt-8 text-center text-[11px] text-muted-foreground font-mono">
            {donationFeePct} donation fee applies. Sub-tree never holds your money.
          </p>
        </section>

        {/* ── CTA banner ──────────────────────────────────── */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-20 text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-3">
              Ready to grow your audience?
            </h2>
            <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">
              Create your Sub-tree page in minutes.
            </p>
            <Link
              href="/sign-up"
              className="landing-cta inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-[color:var(--landing-orange)] px-6 py-3 text-sm font-semibold text-foreground"
            >
              Sign up for free
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
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
              Terms
            </Link>
            <Link href="/cookies" className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
              Cookies
            </Link>
            <CookiePreferencesButton className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
              Cookie preferences
            </CookiePreferencesButton>
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

function FloatingTiles() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 hidden sm:block" aria-hidden="true">
      {FLOATING_TILES.map(({ platform, cls, tone }) => (
        <span
          key={platform}
          className={[
            "landing-tile absolute flex items-center justify-center rounded-2xl border-2 border-foreground",
            tone === "dark" && "bg-foreground text-background",
            tone === "orange" && "bg-[color:var(--landing-orange)] text-foreground",
            tone === "light" && "bg-white text-foreground",
            cls,
          ].filter(Boolean).join(" ")}
        >
          <PlatformIcon platform={platform} className="h-1/2 w-1/2" />
        </span>
      ))}
      <span className="landing-tile absolute right-[9%] top-[30%] flex h-14 w-14 rotate-[12deg] items-center justify-center rounded-2xl border-2 border-foreground bg-[color:var(--landing-orange-soft)]">
        <Heart className="h-7 w-7 fill-[color:var(--landing-orange-strong)] text-foreground" strokeWidth={1.75} />
      </span>
      {SPARKLES.map((cls) => (
        <Sparkle key={cls} className={`absolute h-4 w-4 text-muted-foreground ${cls}`} strokeWidth={1.5} />
      ))}
    </div>
  )
}

function Squiggle() {
  return (
    <svg
      viewBox="0 0 200 20"
      preserveAspectRatio="none"
      className="absolute -bottom-1 left-0 -z-10 h-4 w-full text-[color:var(--landing-orange)]"
      aria-hidden="true"
    >
      <path d="M2 12 C 25 2, 45 20, 70 10 S 115 2, 140 11 S 180 18, 198 6" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
    </svg>
  )
}

function CardTag({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={[
        "self-start rounded-md border px-2 py-0.5 text-[11px] font-medium",
        dark ? "border-white/60 text-white" : "border-foreground text-foreground",
      ].join(" ")}
    >
      {children}
    </span>
  )
}

function FeeChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border-2 border-foreground bg-white/80 px-3 py-2.5">
      <p className="font-mono text-xl font-semibold tracking-tight">{value}</p>
      <p className="text-[11px] text-foreground/70">{label}</p>
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

function PricingCard({ tier }: { tier: Tier }) {
  return (
    <div
      className={[
        "rounded-xl border bg-background p-5 flex flex-col",
        tier.highlight ? "border-foreground shadow-[0_0_0_1px_#111827]" : "border-border",
      ].join(" ")}
    >
      {tier.highlight && (
        <span className="self-start text-[10px] font-bold tracking-[0.08em] uppercase rounded-full bg-primary text-primary-foreground px-2 py-0.5 mb-3">
          Most popular
        </span>
      )}
      <p className="text-sm font-semibold">{tier.name}</p>
      <div className="flex items-baseline gap-1 mt-2 mb-1">
        {tier.price === null ? (
          <span className="text-xl font-semibold tracking-tight">Free</span>
        ) : (
          <>
            <span className="text-xl font-semibold tracking-tight font-mono">
              UGX {tier.price.toLocaleString("en-UG")}
            </span>
            <span className="text-[11px] text-muted-foreground">/month</span>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{tier.blurb}</p>
      <Link
        href={tier.href}
        className={[
          "w-full rounded-lg px-4 py-2 text-xs font-medium text-center transition-colors duration-150 mb-5",
          tier.highlight
            ? "bg-primary text-primary-foreground hover:bg-accent-dark"
            : "border border-border hover:bg-surface",
        ].join(" ")}
      >
        {tier.cta}
      </Link>
      <ul className="border-t border-border pt-4 flex flex-col gap-2.5">
        {tier.features.map(({ label, value }) => (
          <li key={label} className="flex items-start gap-2 text-xs">
            {value === false ? (
              <Minus className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" strokeWidth={2} />
            ) : (
              <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-foreground" strokeWidth={2.5} />
            )}
            <span className={value === false ? "text-muted-foreground" : ""}>
              {label}
              {typeof value === "string" && (
                <span className="ml-1 font-mono text-muted-foreground text-[10px]">· {value}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProfileMockup() {
  return (
    <div className="w-full max-w-[260px] rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
      <div className="h-2 bg-surface border-b border-border" />
      <div className="px-5 py-6 space-y-4">
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
        <div className="w-full rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-medium text-center">
          Support Amara 💛
        </div>
        <p className="text-center text-[9px] text-muted-foreground">
          Powered by Sub-tree
        </p>
      </div>
    </div>
  )
}

function DonatePreview() {
  return (
    <div className="w-full max-w-[220px] rounded-xl border border-border bg-background p-5 space-y-3">
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
