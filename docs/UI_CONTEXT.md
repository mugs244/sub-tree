# UI Context

## Theme

Light mode only at MVP. The design language is clean, modern SaaS — white backgrounds, generous whitespace, monochromatic neutrals with a single dark interactive color. No regional branding, no decorative flourishes, no gradients. The visual goal is "competent global product" — the kind of restraint that signals trust on the donation page and credibility on the creator dashboard. Dark mode is a Pro-tier feature added later, not at MVP.

## Colors

All components must use these tokens via CSS custom properties or Tailwind's arbitrary value syntax referencing them. No hardcoded hex values in component files.

| Role            | CSS Variable       | Value     |
| --------------- | ------------------ | --------- |
| Page background | `--bg-base`        | `#FFFFFF` |
| Surface         | `--bg-surface`     | `#F9FAFB` |
| Surface raised  | `--bg-raised`      | `#FFFFFF` |
| Primary text    | `--text-primary`   | `#111827` |
| Secondary text  | `--text-secondary` | `#4B5563` |
| Muted text      | `--text-muted`     | `#6B7280` |
| Placeholder     | `--text-placeholder` | `#9CA3AF` |
| Primary accent  | `--accent-primary` | `#111827` |
| Accent hover    | `--accent-hover`   | `#1F2937` |
| Border default  | `--border-default` | `#E5E7EB` |
| Border subtle   | `--border-subtle`  | `#F3F4F6` |
| Border focus    | `--border-focus`   | `#111827` |
| Error           | `--state-error`    | `#DC2626` |
| Error subtle    | `--state-error-bg` | `#FEE2E2` |
| Success         | `--state-success`  | `#16A34A` |
| Success subtle  | `--state-success-bg` | `#DCFCE7` |
| Warning         | `--state-warning`  | `#D97706` |
| Warning subtle  | `--state-warning-bg` | `#FEF3C7` |
| Info            | `--state-info`     | `#2563EB` |

Declare these in `app/globals.css` under `:root`. The Tailwind config can extend the color palette to map these tokens (e.g., `text-primary` → `var(--text-primary)`) so component code stays readable.

## Typography

| Role      | Font          | Variable      | Notes                                            |
| --------- | ------------- | ------------- | ------------------------------------------------ |
| UI text   | Geist Sans    | `--font-sans` | Loaded via `next/font/google`, swap fallback     |
| Code/mono | Geist Mono    | `--font-mono` | Used in transaction IDs, code snippets, the URL preview on the username field |

Load both fonts in `app/layout.tsx` with `next/font` for automatic optimization and zero layout shift. Set `Geist Sans` as the body default; never apply a font family on individual components unless intentionally diverging (e.g., the brand wordmark).

Type scale, applied consistently:

| Use case                       | Class                                                  |
| ------------------------------ | ------------------------------------------------------ |
| Page heading (H1)              | `text-3xl md:text-4xl font-semibold tracking-tight`    |
| Section heading (H2)           | `text-2xl font-semibold tracking-tight`                |
| Subsection heading (H3)        | `text-lg font-semibold`                                |
| Form label                     | `text-sm font-medium`                                  |
| Body                           | `text-[15px] leading-relaxed`                          |
| Small / helper                 | `text-xs text-[color:var(--text-muted)]`               |
| Uppercase eyebrow / divider    | `text-xs uppercase tracking-wider text-[color:var(--text-muted)]` |

## Border Radius

| Context                            | Class           |
| ---------------------------------- | --------------- |
| Inline pills, badges, status chips | `rounded-full`  |
| Buttons, inputs, small cards       | `rounded-lg`    |
| Cards, panels, list items          | `rounded-xl`    |
| Modals, drawers, large surfaces    | `rounded-2xl`   |
| Sharp corners (rare, intentional)  | `rounded-none`  |

Avoid mixing radii within a single component cluster. A card with `rounded-xl` should contain buttons with `rounded-lg`, not `rounded-md` — keep the visual hierarchy consistent.

## Component Library

shadcn/ui on top of Tailwind. Components live in `components/ui/`. Use the shadcn CLI to add new primitives rather than writing from scratch:

```bash
npx shadcn@latest add button input label checkbox select dialog dropdown-menu toast
```

Domain components (anything Sub-tree-specific like `LinkCard`, `DonationSheet`, `UsernameInput`, `ProfilePreview`) live in `components/` — not in `components/ui/`. Keep the `ui/` folder pristine so shadcn updates don't conflict with custom code.

Don't write a component from scratch if shadcn has a primitive for it. If shadcn's primitive needs heavy customization, wrap it in a `components/` component rather than editing the `components/ui/` source directly.

## Layout Patterns

- **Auth pages (signup, login, OTP, password reset):** centered single-column max-width 28rem (`max-w-md`), thin top header with logo, thin bottom footer with legal links, generous vertical breathing room (`py-12 md:py-16`).
- **Dashboard shell:** desktop uses a fixed left sidebar (~14rem) with primary nav, main content area with a max-width container; mobile uses a bottom tab bar with 4 tabs (Home, Links, Donations, Profile) and a thin top header for context-specific actions. Same Next.js routes, just different chrome.
- **Public profile page (`/[username]`):** centered single-column max-width 26rem, full-bleed background (theme-customizable in Pro), avatar at top, link stack below, donate button pinned (sticky bottom on mobile, inline at top on desktop). Mobile-first — desktop is just a centered version of the mobile layout.
- **Donation page (`/[username]/donate`):** same max-width as profile page, simpler chrome (back arrow to profile, no nav), focus on the amount/phone form.
- **Modals & drawers:** centered overlay on desktop with backdrop blur (`backdrop-blur-sm bg-black/30`), bottom sheet on mobile (slide up from bottom, max-height 90vh, drag-to-dismiss). Use shadcn's `Dialog` for desktop and `Drawer` for the mobile sheet pattern.
- **Forms:** stacked single column, labels above inputs (never floating labels), helper text below input in `text-xs text-muted`, error state replaces helper text in red. Submit button full-width on mobile, content-width on desktop.
- **Empty states:** centered icon + short heading + one-line description + single primary CTA. Never blank screens.

## Icons

Lucide React. Stroke-based icons only, never filled icon sets mixed in. Standard sizes:

| Use case                       | Size       |
| ------------------------------ | ---------- |
| Inline with body text          | `h-4 w-4`  |
| Inside buttons (left of label) | `h-4 w-4`  |
| Standalone icon buttons        | `h-5 w-5`  |
| Nav items                      | `h-5 w-5`  |
| Empty state illustrations      | `h-12 w-12` (`stroke-1` for lighter weight) |

Stroke width: `stroke-2` (Lucide default) for UI icons, `stroke-1.5` for icons used at larger sizes. Color: inherit from parent (`text-[color:var(--text-primary)]` or whichever role is appropriate) — never hardcode icon colors.

Brand wordmark icon (the small logo mark next to "Sub-tree" in the header) is a custom SVG, not Lucide. Lives at `components/brand/Logo.tsx`.

## Spacing

Tailwind's spacing scale, used consistently:

- **Within a form field group (label → input → helper):** `space-y-1.5`
- **Between form fields:** `space-y-5`
- **Between page sections:** `space-y-8` or `space-y-12`
- **Inside cards (padding):** `p-4` for compact, `p-6` for standard, `p-8` for hero cards
- **Page container padding:** `px-6` mobile, `px-8` desktop

## Motion

Transitions are subtle and purposeful, never decorative:

- **Hover / focus state changes:** `transition-colors duration-150`
- **Layout shifts (collapsing panels, etc.):** `transition-all duration-200`
- **Modal / drawer enter/exit:** handled by shadcn defaults — don't override unless necessary
- **Loading states:** prefer skeleton screens over spinners for content; spinners only for button-internal pending states (`animate-spin` on a small SVG)

No scroll-triggered animations, no parallax, no decorative motion on the marketing pages.

## Accessibility Baseline

Non-negotiable from day one:

- All interactive elements reachable via keyboard, visible focus ring (`focus:ring-2 focus:ring-[color:var(--border-focus)]/20`).
- Form inputs always paired with a `<label>` via `htmlFor` — placeholders are never the only label.
- Color contrast meets WCAG AA — the token values above are pre-checked.
- Touch targets minimum 44×44px on mobile (most buttons hit this naturally with `py-3` and adequate horizontal padding).
- Semantic HTML over div soup — use `<button>`, `<nav>`, `<main>`, `<form>` correctly.