import Link from "next/link"
import { Logo } from "@/components/brand/Logo"
import { PlatformIcon } from "@/components/PlatformIcon"
import { DonationLaunchNotice } from "@/components/DonationLaunchNotice"
import { CookiePreferencesButton } from "@/components/CookiePreferencesButton"
import { ProfileMockup } from "@/components/marketing/ProfileMockup"
import { Heart, ArrowRight, Smartphone, Check, Minus, Sparkle, Copy } from "lucide-react"
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

// ── How it works / feature panel ─────────────────────────
const STEP_LINKS: { platform: Platform; label: string }[] = [
  { platform: "instagram", label: "Instagram" },
  { platform: "youtube",   label: "YouTube" },
  { platform: "whatsapp",  label: "WhatsApp" },
]
// Illustrative weekly views for the analytics mini-chart (percent of height).
const CHART_BARS = [38, 52, 44, 68, 57, 92, 74]
// Mirrors the five presets in components/AppearanceForm.tsx (page bg + accent).
const THEME_SWATCHES = [
  { bg: "#ffffff", accent: "#111827" },
  { bg: "#fffbf5", accent: "#92400e" },
  { bg: "#f0f9ff", accent: "#0369a1" },
  { bg: "#f0fdf4", accent: "#15803d" },
  { bg: "#0f172a", accent: "#e2e8f0" },
]
const DONATION_STEPS = ["Pick an amount", "Approve on phone", "Lands on your MoMo"]

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
      cta: "Sign up for free",
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
    url: "/",
    siteName: "Sub-tree",
    type: "website",
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
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[28px] bg-[color:var(--landing-panel)] px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
            {/* Nav */}
            <header className="relative z-20 flex items-center justify-between">
              <Link href="/" aria-label="Sub-tree home">
                <Logo variant="lockup" />
              </Link>
              <nav className="flex items-center gap-2">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center rounded-md border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-surface transition-colors duration-150"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center rounded-md border border-foreground bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-accent-dark transition-colors duration-150"
                >
                  Sign up
                </Link>
              </nav>
            </header>

            <div className="relative z-10 mt-4">
              <DonationLaunchNotice inline />
            </div>

            {/* Floating platform tiles — real Simple Icons, not drawn props */}
            <FloatingTiles />

            {/* Headline */}
            <div className="relative z-10 mx-auto max-w-3xl pt-8 pb-8 text-center sm:pt-10 sm:pb-10">
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
              <div className="mt-6 flex justify-center">
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
              <div className="relative flex min-h-[240px] flex-col overflow-hidden rounded-[20px] bg-foreground p-6 text-background">
                <CardTag dark>Mobile money</CardTag>
                <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight">Get paid on MoMo</h2>
                <p className="mt-2 text-sm text-white/70">
                  Supporters send money straight to your MTN or Airtel number.
                </p>
                <div className="mt-4 flex gap-2">
                  {["MTN MoMo", "Airtel Money"].map((p) => (
                    <span key={p} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-2.5 py-1 text-[11px] text-white/80">
                      <Smartphone className="h-3 w-3" />
                      {p}
                    </span>
                  ))}
                </div>
                <div className="mt-auto pt-5 grid grid-cols-3 gap-2">
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
              <div className="relative flex min-h-[240px] flex-col overflow-hidden rounded-[20px] bg-[#ececea] p-6">
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
              <div className="relative flex min-h-[240px] flex-col overflow-hidden rounded-[20px] bg-[color:var(--landing-orange)] p-6">
                <CardTag>Simple fees</CardTag>
                <h2 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight">Free to sign up</h2>
                <p className="mt-2 text-sm text-foreground/75">
                  You only pay a small fee when money comes in or goes out.
                </p>
                <div className="mt-auto pt-5 grid grid-cols-2 gap-2">
                  <FeeChip label="Donation fee" value={donationFeePct} />
                  <FeeChip label="Withdrawal fee" value={withdrawalFeePct} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Logo strip ──────────────────────────────────── */}
        <section className="px-3 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 py-6 sm:flex-row sm:justify-between sm:px-2">
            <p className="shrink-0 text-xs font-medium text-muted-foreground">Trusted by creators and organisations</p>
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
              {LOGO_BAR_NAMES.map(({ name, cls }) => (
                <li key={name} className={`text-sm text-foreground/60 ${cls}`}>
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────── */}
        <section className="px-3 sm:px-6">
          <div className="mx-auto max-w-6xl rounded-[28px] bg-[color:var(--landing-panel)] p-4 sm:p-8">
            <SectionHeader tag="How it works" title="Up in three steps" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <StepCard number={1} title="Claim your @username" body="Pick a unique username. That becomes your link.">
                <div className="rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs">
                  sub-tree.com/<span className="font-semibold text-[color:var(--landing-orange-strong)]">you</span>
                </div>
              </StepCard>
              <StepCard number={2} title="Add your links" body="Instagram, YouTube, WhatsApp, your website. Anything you want to share.">
                <div className="space-y-1.5">
                  {STEP_LINKS.map(({ platform, label }) => (
                    <div key={platform} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs">
                      <PlatformIcon platform={platform} className="h-3.5 w-3.5" />
                      {label}
                    </div>
                  ))}
                </div>
              </StepCard>
              <StepCard number={3} title="Share everywhere" body="One link in your bio. Supporters can send you money while they’re there.">
                <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-xs">
                  <span className="font-mono">sub-tree.com/you</span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-foreground px-2 py-1 text-[11px] font-medium text-background">
                    <Copy className="h-3 w-3" />
                    Copy
                  </span>
                </div>
              </StepCard>
            </div>
          </div>
        </section>

        {/* ── Feature bento ───────────────────────────────── */}
        <section className="px-3 pt-3 sm:px-6">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 md:grid-cols-3">
            {/* Analytics */}
            <div className="flex flex-col rounded-[20px] bg-[color:var(--landing-panel)] p-6 md:col-span-2">
              <CardTag>Analytics</CardTag>
              <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-xs">
                  <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight">Know your audience</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    See who visits your page, which links they click, and where your donations come from.
                  </p>
                  <div className="mt-5 flex gap-2">
                    <StatPill value="1,284" label="Page views" />
                    <StatPill value="312" label="Link clicks" />
                  </div>
                </div>
                <div className="flex h-36 items-end gap-2 sm:w-64" aria-hidden="true">
                  {CHART_BARS.map((h, i) => (
                    <div
                      key={i}
                      className={[
                        "flex-1 rounded-t-md border-2 border-foreground",
                        i === CHART_BARS.length - 2 ? "bg-[color:var(--landing-orange)]" : "bg-white",
                      ].join(" ")}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Themes */}
            <div className="flex flex-col rounded-[20px] bg-[color:var(--landing-orange-soft)] p-6">
              <CardTag>Appearance</CardTag>
              <h3 className="mt-4 text-2xl sm:text-3xl font-semibold tracking-tight">Make it yours</h3>
              <p className="mt-2 text-sm text-foreground/70">
                Bold templates, five themes, your photo and your button style. Changes save as you go.
              </p>
              <div className="mt-auto flex gap-2 pt-5" aria-hidden="true">
                {THEME_SWATCHES.map(({ bg, accent }) => (
                  <span
                    key={bg}
                    className="flex h-10 flex-1 items-end justify-center rounded-xl border-2 border-foreground pb-1.5"
                    style={{ background: bg }}
                  >
                    <span className="h-1.5 w-5 rounded-full" style={{ background: accent }} />
                  </span>
                ))}
              </div>
            </div>

            {/* How a donation works */}
            <div className="flex flex-col gap-8 rounded-[20px] bg-foreground p-6 text-background sm:p-8 md:col-span-3 md:flex-row md:items-center">
              <div className="flex-1">
                <CardTag dark>Mobile money</CardTag>
                <h3 className="mt-4 text-2xl sm:text-4xl font-semibold tracking-tight">
                  No bank, no card, no middleman
                </h3>
                <p className="mt-2 max-w-md text-sm text-white/70">
                  Your supporters pay from their phone, and the money goes to your registered MoMo number.
                </p>
                <ol className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {DONATION_STEPS.map((s, i) => (
                    <li key={s} className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2.5 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[color:var(--landing-orange)] font-mono text-xs font-bold text-foreground">
                        {i + 1}
                      </span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex shrink-0 justify-center text-foreground">
                <DonatePreview />
              </div>
            </div>
          </div>
        </section>

        {/* ── Testimonials ────────────────────────────────── */}
        <section className="px-3 pt-3 sm:px-6">
          <div className="mx-auto max-w-6xl rounded-[28px] bg-[color:var(--landing-panel)] p-4 sm:p-8">
            <SectionHeader tag="Creators" title="Quiet wins from real creators" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <figure
                  key={t.handle}
                  className={[
                    "landing-tile flex flex-col gap-5 rounded-[20px] border-2 border-foreground p-6",
                    i === 1 ? "bg-[color:var(--landing-orange)]" : "bg-white",
                  ].join(" ")}
                >
                  <blockquote className="flex-1 text-[15px] leading-relaxed">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-sm font-semibold text-background">
                      {t.initial}
                    </span>
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold">{t.name}</span>
                      <span className={i === 1 ? "text-[11px] text-foreground/70" : "text-[11px] text-muted-foreground"}>
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
        <section id="pricing" className="px-3 pt-3 sm:px-6">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-6 rounded-[28px] bg-[color:var(--landing-panel)] p-4 sm:p-8 md:grid-cols-2">
            <div>
              <CardTag>Pricing</CardTag>
              <h2 className="mt-4 text-3xl sm:text-5xl font-bold tracking-tighter">Simple, transparent pricing</h2>
              <p className="mt-3 max-w-md text-sm text-muted-foreground">
                Everything you need to share your links and accept mobile money donations, at no cost to sign up.
              </p>
              <div className="mt-6 grid max-w-sm grid-cols-2 gap-2">
                <FeeChip label="Donation fee" value={donationFeePct} />
                <FeeChip label="Withdrawal fee" value={withdrawalFeePct} />
              </div>
              <p className="mt-4 text-[11px] font-mono text-muted-foreground">Sub-tree never holds your money.</p>
            </div>
            {TIERS.map((tier) => (
              <PricingCard key={tier.id} tier={tier} />
            ))}
          </div>
        </section>

        {/* ── Closing CTA ─────────────────────────────────── */}
        <section className="px-3 py-3 sm:px-6">
          <div className="mx-auto max-w-6xl rounded-[28px] border-2 border-foreground bg-[color:var(--landing-orange)] px-6 py-12 text-center sm:py-16">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tighter">Ready to grow your audience?</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-foreground/75">Create your Sub-tree page in minutes.</p>
            <Link
              href="/sign-up"
              className="landing-cta mt-7 inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-white px-7 py-3.5 text-[16px] font-semibold text-foreground"
            >
              Sign up for free
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="px-3 pb-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-5 rounded-[28px] bg-foreground px-6 py-6 text-background sm:flex-row sm:items-center">
          <span className="rounded-lg bg-[color:var(--landing-panel)] px-2 py-1">
            <Logo variant="lockup" />
          </span>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/sign-up" className="text-xs text-white/70 hover:text-white transition-colors duration-150">
              Sign up
            </Link>
            <Link href="/sign-in" className="text-xs text-white/70 hover:text-white transition-colors duration-150">
              Sign in
            </Link>
            <a href="mailto:hello@sub-tree.com" className="text-xs text-white/70 hover:text-white transition-colors duration-150">
              Contact
            </a>
            <Link href="/terms" className="text-xs text-white/70 hover:text-white transition-colors duration-150">
              Terms
            </Link>
            <Link href="/cookies" className="text-xs text-white/70 hover:text-white transition-colors duration-150">
              Cookies
            </Link>
            <CookiePreferencesButton className="text-xs text-white/70 hover:text-white transition-colors duration-150">
              Cookie preferences
            </CookiePreferencesButton>
          </nav>
          <p className="text-xs text-white/60 sm:text-right">
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
function SectionHeader({ tag, title }: { tag: string; title: string }) {
  return (
    <div className="mb-6 sm:mb-8">
      <CardTag>{tag}</CardTag>
      <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tighter">{title}</h2>
    </div>
  )
}

function StepCard({
  number,
  title,
  body,
  children,
}: {
  number: number
  title: string
  body: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 rounded-[20px] border-2 border-foreground bg-white p-5">
      <span className="landing-tile flex h-10 w-10 items-center justify-center rounded-xl border-2 border-foreground bg-[color:var(--landing-orange)] font-mono text-sm font-bold">
        {number}
      </span>
      <div>
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
      </div>
      <div className="mt-auto">{children}</div>
    </div>
  )
}

function StatPill({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border-2 border-foreground bg-white px-3 py-2">
      <p className="font-mono text-lg font-semibold tracking-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function PricingCard({ tier }: { tier: Tier }) {
  return (
    <div className="landing-tile flex w-full flex-col rounded-[20px] border-2 border-foreground bg-white p-6 md:ml-auto md:max-w-md">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold">{tier.name} plan</p>
        <span className="text-3xl font-bold tracking-tighter">
          {tier.price === null ? "Free" : `UGX ${tier.price.toLocaleString("en-UG")}`}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{tier.blurb}</p>
      <ul className="mt-5 grid grid-cols-1 gap-2.5 border-t border-border pt-5 sm:grid-cols-2">
        {tier.features.map(({ label, value }) => (
          <li key={label} className="flex items-start gap-2 text-xs">
            {value === false ? (
              <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
            ) : (
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--landing-orange-strong)]" strokeWidth={3} />
            )}
            <span className={value === false ? "text-muted-foreground" : ""}>
              {label}
              {typeof value === "string" && (
                <span className="ml-1 font-mono text-[10px] text-muted-foreground">· {value}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <Link
        href={tier.href}
        className="landing-cta mt-6 inline-flex items-center justify-center gap-2 rounded-full border-2 border-foreground bg-[color:var(--landing-orange)] px-5 py-3 text-sm font-semibold text-foreground"
      >
        {tier.cta}
        <ArrowRight className="h-4 w-4" />
      </Link>
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
