# Sub-tree Design System

A design system for **Sub-tree** â a link-aggregator + mobile-money tipping platform built for creators, small businesses, and organisations across East Africa. Think *Linktree, but the donate button speaks MTN MoMo and Airtel Money.*

The product lives at `sub-tree.com/<username>`: one shareable page for everything a creator wants to publish (socials, YouTube, WhatsApp, shop, music) plus a pinned **Support** button that opens a mobile-money donation flow. No card payments, no bank account required.

> "Global tools like Linktree ignore markets where most people don't have credit cards. Sub-tree is the link-tree that actually gets you paid in shillings."

## Sources

This system was reverse-engineered from the actual production codebase. If you have access, browse them for the deepest fidelity:

- **Codebase**: `sub-tree/` â Next.js 16 App Router, Tailwind v4, shadcn/ui, Clerk auth, Prisma/Postgres. See `sub-tree/docs/PROJECT-OVERVIEW.md` and `sub-tree/docs/UI_CONTEXT.md` for the canonical spec.
- **GitHub mirror**: <https://github.com/mugs244/sub-tree> â same code, browse on demand. Useful for inspecting any component this system simplified.

If you're iterating on a Sub-tree screen, **read the source files first** â the codebase is the source of truth. This system is a curated slice of it for quick reference and throwaway prototyping.

---

## Products in this system

Sub-tree is a single Next.js app with three distinct surfaces, each rendered very differently:

| Surface | Audience | Vibe |
| --- | --- | --- |
| **Marketing** (`/`) | First-time visitors deciding whether to sign up | Confident, restrained, big type, mini-mockups of the product |
| **Creator Dashboard** (`/dashboard/*`) | Logged-in creators managing their page | Calm SaaS â sidebar on desktop, bottom tabs on mobile, status badges, tables |
| **Public Profile** (`/[username]`) | A creator's audience tapping a link in someone's bio | Mobile-first, single column, link stack, theme-customizable, donate button pinned |

There is **no native app**. Mobile-web is a first-class citizen.

UI kit recreations live in `ui_kits/<product>/` â see [UI Kits](#ui-kits) below.

---

## Content fundamentals

Tone is the product's most under-appreciated asset. Sub-tree's copy is **calm, plain-spoken, locally aware**. It does not try to sound Silicon Valley and it does not patronise an East African audience by overexplaining.

### Voice

- **Plain English, short sentences.** "All your links. One page." (hero) "Up in three steps." (how-it-works). No marketing jargon, no "leverage," no "unlock."
- **Second person, never first.** "Your page," "your supporters," "share everywhere." Sub-tree never says "we" in the product UI â only in legal pages and the founder's blog.
- **Action verbs in CTAs.** "Claim your username," "Add link," "Donate UGX 5,000," "Back to profile." Not "Get started today!" or "Start your journey."
- **No exclamation marks.** A single one anywhere in the UI is a mistake. Confidence comes from restraint.

### Casing

- **Sentence case everywhere.** Buttons, headings, nav items: "Add link" not "Add Link." Page titles in browser tab use Title Case ("Support Amara Naledi â Sub-tree") because that's a different surface.
- **Brand is `Sub-tree`** â capital S, hyphenated, lowercase t. Never "Subtree," never "SubTree." The wordmark itself uses a muted hyphen: `Sub` + grey `-` + `tree`.
- **Usernames are `@handle` with mono font.** `@amara` always, never `Amara` or `/amara/`.
- **Currency is `UGX` (uppercase, mono) before the amount.** "UGX 5,000" not "5,000 UGX" or "5000 shillings."

### Emoji

- **One emoji, one place.** The yellow heart `ð` is the *only* emoji the product ships, and it only appears in the public donate button: `Support Amara ð`. Yellow because it reads as warmth without political colour-coding.
- No emoji in the dashboard, no emoji in marketing, no emoji in error states, no emoji in empty states. Lucide icons or nothing.
- Unicode glyphs like `â` and `â` are allowed for navigation links ("â Back to profile") because they read as typography, not stickers.

### Specifics â pulled from the source

- Hero: "All your links. / One page." (line break is intentional â it's a couplet, not a sentence.)
- Sub-hero: "Share everything you create â links, content, social profiles â and accept mobile money donations directly, all from a single Sub-tree link."
- Pricing badge: "Free to get started" â never "Free forever" or "$0/mo."
- Empty state for donations: "No donations yet. Once supporters donate via your public page, they'll appear here. Mobile money integration coming soon."
- Pending payment screen: "Check your phone. A payment prompt has been sent to 07XX XXX XXX. Approve it to complete your donation." â direct, second-person, no urgency theatre.
- Error: "Could not save â please try again" (em-dash, no period at the end of short status messages).
- Footer is `Â© 2026 Sub-tree` with nothing else. No tagline, no social row.

### Localisation

- Currency is **UGX** at MVP (Uganda only). Architecture is ready for KES, TZS, RWF â but never *invent* multi-currency copy until those markets ship.
- Date format `15 Mar 2026` (`day-numeric, month-short, year-numeric`, locale `en-UG`). Never `03/15/2026` (US) or `15/03/26`.
- Phone numbers shown as `07XX XXX XXX` placeholder; never with `+256` prefix in user-facing UI (the API adds the country code).

---

## Visual foundations

> The visual goal is **"competent global product"** â the kind of restraint that signals trust on the donation page and credibility on the dashboard.

### Colour

Sub-tree is **monochromatic by design**. Near-black on white, with grey scaffolding. There is no brand blue, no brand purple, no gradient. The only "colour" is in semantic state badges (success green, warning amber, error red) and the optional theme presets a Pro creator can apply to their *public* page only.

| Role | Hex | Where it lives |
| --- | --- | --- |
| Primary text / accent | `#111827` | Body copy, headings, primary buttons, focus rings |
| Accent hover | `#1F2937` | Hover state for `bg-primary` |
| Secondary text | `#4B5563` | Body para support |
| Muted text | `#6B7280` | Helper text, metadata, captions |
| Placeholder | `#9CA3AF` | Input placeholders |
| Page background | `#FFFFFF` | The actual page |
| Surface | `#F9FAFB` | Sidebar, table headers, "muted" surfaces |
| Border default | `#E5E7EB` | Card borders, dividers â load-bearing |
| Border subtle | `#F3F4F6` | Barely-there separators |

State colours are used **only** on status badges, error text, and the matching `*-bg` tints. They are never used on primary actions.

| State | Hex | Background tint |
| --- | --- | --- |
| Error | `#DC2626` | `#FEE2E2` |
| Success | `#16A34A` | `#DCFCE7` |
| Warning | `#D97706` | `#FEF3C7` |
| Info | `#2563EB` | (no tint used) |

**Theme presets** (public profile only, Pro feature): `default`, `warm` (sand + sienna), `cool` (sky + sea), `forest` (mint + emerald), `midnight` (navy + slate, inverts the stack). See `colors_and_type.css` for the swatches.

### Typography

- **Geist Sans** for everything â body, headings, buttons.
- **Geist Mono** for: usernames (`@amara`), URLs in link cards, currency amounts (`UGX 5,000`), transaction IDs, the phone-number placeholder, donation source labels.
- **Sentence case, semibold (600) for headings, medium (500) for buttons/labels, regular (400) for body.** Tracking is tight on `h1`/`h2` (`-0.02em` / `-0.015em`), default elsewhere.

Type scale:

| Use | Class hint | Size / line |
| --- | --- | --- |
| Marketing H1 | `text-4xl/5xl font-semibold tracking-tight` | 36â48 / 1.1 |
| Page heading | `text-3xl md:text-4xl font-semibold tracking-tight` | 30â36 |
| Section heading | `text-2xl font-semibold tracking-tight` | 24 / 32 |
| Subsection | `text-lg font-semibold` | 18 / 28 |
| Body | `text-[15px] leading-relaxed` | 15 / ~24 |
| Form label | `text-sm font-medium` | 14 |
| Helper / metadata | `text-xs text-muted` | 12 |
| Eyebrow | `text-xs uppercase tracking-wider text-muted` | 12 |

### Spacing

Tailwind 4-unit scale, used rigidly:

- Inside a form field group (label â input â helper): `space-y-1.5`
- Between form fields: `space-y-5`
- Between page sections: `space-y-8` or `space-y-12`
- Card padding: `p-4` compact, `p-6` standard, `p-8` hero
- Page container: `px-6` mobile, `px-8` desktop

### Border radius (strict ladder)

- `rounded-full` â pills, badges, status chips, avatars, toggles
- `rounded-lg` (8 px) â **buttons, inputs, link cards in the manager, small cards**
- `rounded-xl` (12 px) â cards, panels, list items, the donation form container
- `rounded-2xl` (16 px) â modals, drawers, the mobile-money-highlight section
- `rounded-none` â never, except deliberate "sharp" theme variant

Never mix more than two radii in one cluster. A card at `rounded-xl` contains buttons at `rounded-lg`, not `rounded-md`.

### Backgrounds

- **No imagery.** No hero photo, no illustration grid, no background pattern. The marketing page is white space + mini mockups + type.
- **No gradients.** Anywhere. Banned by the spec.
- **No textures, no grain, no noise.** Borders carry hierarchy.
- **Two surface tones.** `#FFFFFF` for primary, `#F9FAFB` for surface. That's it.
- The mobile-money highlight section uses `bg-surface` inside a `rounded-2xl border` â the visual rhythm comes from swapping surface tone, not adding decoration.

### Borders, shadows & elevation

- **Borders do almost all the work.** A 1 px `--border-default` separates almost every group. The dashboard sidebar is a `border-r`, the table header is a `border-b`, every card has a `border` (no shadow).
- **Shadow is essentially absent.** The one place it shows up is the floating profile mockup on the marketing hero (`shadow-sm` only). Modals and popovers from shadcn default to subtle shadows, but they are not styled to be prominent.
- No glow, no inset shadow, no neumorphism. Ever.

### Animation & motion

- **Subtle and purposeful, never decorative.**
- `transition-colors duration-150` on every interactive element (hover, focus).
- `transition-all duration-200` for layout shifts (collapsing panels).
- Modal / drawer enter / exit: shadcn defaults â don't override.
- **Skeletons over spinners** for content loading. Spinners only for button-internal pending states (`Loader2` from Lucide with `animate-spin`).
- **No scroll-triggered animations, no parallax, no decorative motion on marketing pages.**
- A small detail: the link-card manager calls `navigator.vibrate(20)` on every tap. The interaction is tactile by intent.

### Interaction states

- **Hover (buttons):** colour shifts to `--accent-hover` (`#1F2937`), no scale, no shadow.
- **Hover (ghost / outline):** add `bg-surface` (`#F9FAFB`).
- **Hover (link card):** `border-foreground/20` darkens the border, nothing else.
- **Press:** no scale-down, no haptic effect *in CSS* â the JS `navigator.vibrate(20)` is the press feedback on touch.
- **Focus-visible:** `ring-2 ring-ring/20` (where `ring` is `#111827` at 20% opacity). Always visible for keyboard users; the source spec calls this non-negotiable.
- **Disabled:** `opacity: 0.5`, `pointer-events: none`.

### Transparency & blur

- **Backdrop-blur** is used in exactly two places: the sticky top header on marketing (`bg-background/90 backdrop-blur-sm`) and the modal backdrop (`backdrop-blur-sm bg-black/30`).
- Card backgrounds are never translucent.
- No "glassmorphism" panels. The aesthetic is opaque and matte.

### Layout rules

- **Marketing**: `max-w-5xl` container, centred, generous vertical rhythm (`py-20`).
- **Auth pages**: `max-w-md` single column, thin top header with logo, thin bottom footer with legal links, `py-12 md:py-16`.
- **Dashboard**: fixed `w-56` sidebar on `md:` and up, content area is `max-w-3xl` or `max-w-4xl`. Mobile collapses to a 5-icon bottom tab bar (Home, Links, Donations, Appearance, Settings).
- **Public profile**: `max-w-sm`, centred, mobile-first.
- **Forms**: stacked single column, labels *above* inputs (never floating), helper text below in `text-xs text-muted`, error text replaces helper text in `text-destructive`. Submit button is full-width on mobile, content-width on desktop.
- **Empty states**: centred icon (`h-12 w-12 stroke-1` â extra light weight) + short heading + one-line description + one primary CTA. Never a blank screen.

### Cards â the dominant component

The system is largely cards on cards. The recipe:

```
border border-border bg-background rounded-xl p-6 space-y-4
```

Variations:
- **Stat card**: `rounded-xl border bg-surface p-4` with a small `rounded-lg border bg-background` icon square in the top-left.
- **Link card** (manager): `rounded-xl border bg-background overflow-hidden`, with a divided action strip (`divide-x divide-border`) along the bottom.
- **Feature card** (marketing): `rounded-xl border bg-background p-6 flex flex-col gap-4` with a `h-10 w-10 rounded-lg border bg-surface` icon container.
- **Section card** (mobile-money highlight): `rounded-2xl border bg-surface p-8 md:p-12 flex flex-col md:flex-row`. The bigger radius signals "this is a section, not a list item."

---

## Iconography

Sub-tree mixes two icon systems by deliberate convention. Read both rules before mixing them.

### 1. Lucide React â for all UI chrome

Every dashboard icon, every nav icon, every empty-state illustration, every button-internal icon comes from [Lucide](https://lucide.dev). They are stroke-based and we never substitute filled icon sets in.

| Size | When |
| --- | --- |
| `h-4 w-4` | Inline with body text, inside buttons (left of label) |
| `h-5 w-5` | Standalone icon buttons, nav items |
| `h-12 w-12` `stroke-1` | Empty-state illustration weight |

Stroke width is `stroke-2` (default) for UI icons and `stroke-1.5` for icons at larger sizes â the dashboard sidebar uses `stroke-1.5` when inactive and `stroke-2` when active to signal weight change instead of colour change.

Colour: **always inherit from the parent**. We never hardcode `text-blue-500` on an icon.

**Loaded from CDN in HTML artifacts** via `https://unpkg.com/lucide@latest` (already used in `preview/` cards).

The full Lucide names used in the source:
`Home`, `Link2`, `Heart`, `Palette`, `Settings`, `ExternalLink`, `LogOut`, `Plus`, `Pencil`, `Trash2`, `ChevronUp`, `ChevronDown`, `Check`, `X`, `Loader2`, `Phone`, `Smartphone`, `Globe`, `Eye`, `TrendingUp`, `ArrowRight`, `BarChart2`.

### 2. Brand SVG paths â for social platforms

Social-platform icons (Instagram, YouTube, TikTok, WhatsApp, X, Spotify, etc.) are **brand SVG paths** copied from the Simple Icons set and rendered with `fill="currentColor"`. They are NOT Lucide outlines because users recognise the silhouette of the YouTube play button, not a "video" icon.

They live in `assets/brand/PlatformIcon.tsx` (and are linkable from any HTML artifact through that file). The platform list:

`youtube`, `instagram`, `tiktok`, `twitter` (X), `facebook`, `whatsapp`, `github`, `linkedin`, `substack`, `patreon`, `spotify`, `soundcloud`, `twitch`, `discord`, `pinterest`, `snapchat`, `telegram`, `medium`, `beehiiv`. Anything else falls back to Lucide's `Globe` icon.

### 3. The brand mark itself

The Sub-tree logo is a **custom stroked SVG**: a stacked-V pine tree silhouette with a filled top peak, three open V-rows, and a short trunk. It lives at:

- `assets/brand/logo-mark.svg` â just the tree, inherits `currentColor`. Use in a dark rounded square for the lockup.
- `assets/brand/logo-icon.svg` â the tree pre-wrapped in a `#111827` rounded square.
- `assets/brand/logo-lockup.svg` â icon + wordmark.

The wordmark is set in **Geist semibold, tracking-tight**, with the hyphen muted: `Sub` `-` (in `--text-muted`) `tree`. That hyphen colour is the only typographic flourish in the entire brand.

### Emoji policy in icons

The yellow heart `ð` appears only as a trailing affordance on the public donate button. It is not used anywhere else. Unicode arrows (`â`, `â`) are fair game for inline link affordances. No other emoji, ever.

---

## Index

```
sub-tree-design-system/
âââ README.md                  â you are here
âââ SKILL.md                   â entry-point for Claude Code skill use
âââ colors_and_type.css        â color + type tokens, drop into any HTML
âââ assets/
â   âââ brand/
â   â   âââ Logo.tsx           â source React component (read-only reference)
â   â   âââ PlatformIcon.tsx   â all social-platform SVG paths
â   â   âââ logo-mark.svg      â tree mark only, currentColor
â   â   âââ logo-icon.svg      â tree on dark rounded square
â   â   âââ logo-lockup.svg    â icon + wordmark
â   âââ favicon.ico
âââ preview/                   â Design System tab cards (one HTML per concept)
âââ ui_kits/
â   âââ marketing/             â Landing page recreation
â   âââ dashboard/             â Logged-in creator dashboard
â   âââ profile/               â Public profile + donation flow
âââ fonts/                     â (none â Geist loaded from Google Fonts CDN)
```

### UI Kits

Each UI kit folder contains:
- `index.html` â a clickable demo that runs in the browser (no build step). Open it and click through.
- `*.jsx` â small, factored React components matched to the source codebase.
- `README.md` â what's in the kit and what was simplified.

| Kit | Surface | Open |
| --- | --- | --- |
| Marketing | Landing page, hero, features, CTA banner, footer | `ui_kits/marketing/index.html` |
| Dashboard | Sidebar + bottom tab nav, Home / Links / Donations / Appearance | `ui_kits/dashboard/index.html` |
| Profile | Public link page, donate sheet, theme presets | `ui_kits/profile/index.html` |

### Foundations & next steps for the reader

If you have access to the underlying codebase:
- Read `sub-tree/docs/PROJECT-OVERVIEW.md` for product scope and the success criteria.
- Read `sub-tree/docs/UI_CONTEXT.md` for the canonical token table and spacing rules.
- Read `sub-tree/docs/STANDARDS.md` for the code-side rules that constrain UI work (Tailwind v4, no hardcoded hex, no `dark:` at MVP).

If you don't have access, browse the GitHub mirror: <https://github.com/mugs244/sub-tree>. Source-of-truth files for design context are everything under `sub-tree/components/` (especially `LinkCard.tsx`, `DonateForm.tsx`, `layouts/DashboardLayout.tsx`) and the marketing page at `sub-tree/app/page.tsx`.
