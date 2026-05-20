# Progress Tracker

Update this file after every meaningful implementation change. Treat it as the running log of what's done, what's next, and what context the next session needs to resume cleanly.

## Current Phase

Phase 2 complete. Phase 3 donation skeleton + MoMo abstraction layer shipped. Next: Feature 16 (MoMo webhook handler) and Feature 17 (Africa's Talking SMS — blocked on API key).

## Completed

- Product spec written and locked in (`CLAUDE.md`).
- UI design system documented (`UI_CONTEXT.md`) — light mode, white/neutral/dark accent, Geist Sans + Mono, shadcn/ui on Tailwind, mobile-first layouts.
- Brand decided: **Sub-tree** (hyphenated). Primary domain `sub-tree.com`. Regional domain `sub-tree.ug`. No regional/Africa-specific visual branding at MVP.
- Signup page UI designed and prototyped as a React component (validates phone, email, password strength, live username availability check, reserved-name handling).
- OTP verification screen designed (6-digit input, auto-advance, paste support, 60s resend timer, username reservation reminder).
- Core product decisions locked:
  - Phone + email both required at signup; phone hard-verified, email soft-verified.
  - Username policy: free-for-all + reserved word list with admin review queue for reserved-name claims.
  - Free tier: unlimited links. Pro tier: themes, full analytics, lower donation fee, verified badge.
  - SMS provider: Africa's Talking.
  - Mobile money: MTN MoMo Collections + Airtel Money Collections, direct-to-creator settlement (platform fee split at API level).
  - Account types: individual (default), business/NGO (KYB upgrade later, not at signup).
- **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 project scaffolded.**
- **Feature 03 — Clerk Auth Integration shipped:** ClerkProvider, sign-in/sign-up pages, webhook handler (`/api/webhooks/clerk`), Prisma User model with `clerk_user_id`, `middleware.ts` protecting `/dashboard` and `/onboarding` routes. `prisma.config.ts` added for Prisma v7 migration support.
- **Feature 04 — Username Claim & Onboarding shipped:** `ReservedUsername` + `UsernameClaim` Prisma models, migration applied, 56 reserved usernames seeded. `lib/validators/username.ts` (Zod), `lib/services/username.ts` (availability check + atomic claim), `GET /api/onboarding/check-username`, `POST /api/onboarding/claim-username`, `app/onboarding/username/page.tsx` (server guard + client `UsernameForm` with live debounced check), `db/seed.ts`.
- **Feature 05 — Quick Profile & First Link Onboarding shipped:** `Profile` and `Link` Prisma models migrated (`20260519194941_feature_05_profile_link`). `lib/validators/profile.ts` + `lib/validators/link.ts` (Zod), `lib/services/profile.ts` (upsert profile) + `lib/services/link.ts` (append link at next position), `POST /api/onboarding/save-profile`, `POST /api/onboarding/add-link`, `app/onboarding/profile/page.tsx` (server guard + `ProfileForm` — display name required, bio + avatar URL optional), `app/onboarding/links/page.tsx` (server guard + `FirstLinkForm` with skip). Username claim now redirects to `/onboarding/profile` instead of `/dashboard`.
- **Feature 08 — Dashboard Shell & Navigation shipped:** Root layout stripped (no Clerk header stub). `components/layouts/DashboardLayout.tsx` rebuilt as `"use client"` — 5-item fixed sidebar (desktop), 4-item bottom tab bar (mobile), `UserButton` + `@username` in sidebar footer. `app/(dashboard)/dashboard/layout.tsx` — auth guard + onboarding guard (username → profile → dashboard). All 5 dashboard tab pages scaffolded: Home (stat cards: links, donations, profile views), Links, Donations, Appearance, Settings.
- **Feature 09 — Links Manager shipped:** `lib/validators/link.ts` extended with `updateLinkSchema` + `reorderLinkSchema`. `lib/services/link.ts` full CRUD: `listLinks`, `addLink`, `updateLink`, `deleteLink` (transaction: delete + decrement positions), `reorderLink` (position swap), `recordLinkClick` (P2025-safe). API routes: `GET/POST /api/links`, `PATCH/DELETE /api/links/[id]`, `POST /api/links/[id]/reorder`, `POST /api/links/[id]/click`. `LinkCard` component: inline edit, toggle switch, up/down reorder, delete-with-confirm. `LinksManager` component: optimistic state updates for toggle/delete/reorder, re-fetches from API after add.
- **Feature 10 — Public Profile Page shipped:** `app/[username]/page.tsx` — server component with `generateMetadata`, `TrackedLink` click tracking for links, plain `<a>` for donate CTA. `components/TrackedLink.tsx` — fire-and-forget click tracking. `app/[username]/donate/page.tsx` — donation entry point. `app/api/links/[id]/click/route.ts` — unauthenticated POST, returns 204.
- **Feature 11 — Appearance shipped:** `components/AppearanceForm.tsx` — 5 theme presets with colour swatches, 3 button styles. `app/api/profile/appearance/route.ts` — POST, auth-guarded (added to `middleware.ts` protected routes). `app/(dashboard)/dashboard/appearance/page.tsx` — server component fetching profile theme/button state. Schema migration `20260519202414_feature_phase2_phase3_schema` adds `theme_preset` + `button_style` to `Profile`, `clicks` to `Link`, and full `Donation` + `DonationEvent` models with `DonationStatus` + `MomoProvider` enums.
- **Feature 12 — Reserved Username Admin Queue shipped:** `lib/services/username.ts` extended with `requestReservedUsername` (idempotent — creates `UsernameClaim` record). `UsernameForm` updated: when a username is reserved, shows "Request this username →" link; after submission shows "Request submitted — we'll review it within 48 hours." `POST /api/onboarding/request-reserved-username`. Admin service `lib/services/admin.ts`: `isAdmin` (env var `ADMIN_CLERK_USER_IDS`), `listClaims`, `approveClaim` (transaction: set User.username + delete ReservedUsername + mark APPROVED), `rejectClaim`. Admin routes `GET /api/admin/claims` + `POST /api/admin/claims/[id]` (approve/reject). Admin page at `app/admin/claims/page.tsx` + `AdminClaimsTable` client component (approve button, reject with inline reason input). `/admin/(.*)` and `/api/admin/(.*)` added to middleware protected routes.
- **Phase 3 Donation Skeleton shipped:** `components/DonateForm.tsx` — amount presets + custom, phone, donor name, note, pending state after submit. `app/api/payments/initiate/route.ts` — validates input, detects MTN vs Airtel from Uganda phone prefixes (077/078/039/031 = MTN, 070/075/074 = Airtel), creates `Donation` DB record, returns 202 with `idempotency_key`. TODO comment in place for MoMo STK push once API credentials are configured.
- **Feature 18 — CSV Donation Export shipped:** `components/DonationExportButton.tsx` — client-side CSV generation and blob download. `app/api/donations/export/route.ts` — GET all donations for the authenticated user. Button added to Donations dashboard header.
- **Feature 19 — Page View Analytics shipped:** `view_count Int @default(0)` added to `Profile` model. Migration `20260520174326_feature_19_view_count` applied. `components/PageViewTracker.tsx` — fires POST on mount (fire-and-forget). `app/api/views/[username]/route.ts` — unauthenticated, increments `view_count` via `updateMany`. Dashboard Home stat card now shows live view count.
- **Feature 21 — Rate Limiting on Donation Initiation shipped:** `lib/rateLimit.ts` — in-memory sliding window rate limiter (Map-based, single-instance safe). Limits donation attempts to 3 per phone per 10 minutes. Returns 429 with `Retry-After` header. Documented: replace with Upstash Redis for multi-instance deployment.
- **Feature 22 — OG Image Generation shipped:** `app/[username]/opengraph-image.tsx` — file-based Next.js OG image. Renders avatar, display name, @username, bio (truncated to 120 chars). Uses `ImageResponse` from `next/og`, `runtime = "nodejs"`, 1200×630px.
- **Feature 23 — Account Deletion shipped:** `components/DeleteAccountButton.tsx` — two-step inline confirmation. `app/api/account/delete/route.ts` — soft-deletes in Postgres (sets `deleted_at`, clears `username`) then hard-deletes from Clerk. Donation records retained.
- **Feature 13/14 — MoMo Service Abstraction Layer shipped:** `lib/services/momo/types.ts` — `MomoProvider` interface + shared types. `lib/services/momo/mtn.ts` — full MTN MoMo Collections client (OAuth2 Basic auth, `requestToPay`, HMAC-SHA256 `verifyCallback`). `lib/services/momo/airtel.ts` — full Airtel Money Collections client (client_credentials OAuth2, `requestToPay`, HMAC-SHA256 `verifyCallback`). Both clients wired to env vars; `requestToPay` call in `initiate/route.ts` is still behind a TODO comment pending credentials.
- **Theme presets on public profile page:** CSS custom properties injected as inline `style` on `<main>` cascade through Tailwind `var()` chain — all children inherit the theme without client JS. `THEME_VARS` map covers default, warm, cool, forest, midnight.
- **Profile edit in Settings:** `components/EditProfileForm.tsx` — reuses `/api/onboarding/save-profile`, shows "Saved!" state in-place (no redirect). Added to `app/(dashboard)/dashboard/settings/page.tsx` which also shows account info rows, `UserButton` for Clerk account management, and the danger zone.

## In Progress

Nothing.

## Next Up

1. **Feature 16 — MoMo Webhook Handler** — `POST /api/webhooks/momo/mtn` and `POST /api/webhooks/momo/airtel`: verify HMAC signature via `verifyCallback`, update `Donation.status`, create `DonationEvent` record.
2. **Feature 17 — SMS Notifications** — Africa's Talking: notify creator on successful donation (blocked: Africa's Talking API key not yet configured).
3. **Wire MoMo STK push** — once MTN/Airtel sandbox credentials are available, remove the TODO comment in `app/api/payments/initiate/route.ts` and call `mtnMomo.requestToPay` / `airtelMoney.requestToPay`.

## Open Questions

- **Domain availability not yet confirmed.** Need to verify `sub-tree.com` and `sub-tree.ug` are actually available and register them. Recommend Cloudflare Registrar for `.com` and a Ugandan registrar (Hostalite, Truehost) for `.ug`.
- **MoMo API onboarding not yet started.** MTN MoMo Collections and Airtel Money production access take 2–6 weeks each. Need to start the merchant applications now, in parallel with development, or the donation flow will be blocked when ready to integrate.
- **BoU regulatory question unresolved.** Receiving donations on behalf of creators may trigger Bank of Uganda payment aggregator licensing under the National Payment Systems Act, 2020. Direct-to-creator settlement is the planned mitigation, but worth a consultation with a payments-savvy Ugandan lawyer before launch.
- **Pro tier pricing not yet tested.** Working assumption is UGX 10,000–15,000/month. Validate with a small group of target creators before committing.
- **Fee structure final numbers.** Working assumption is 5% on free tier, 3% on Pro. Need to confirm what MTN/Airtel MoMo charge us first, then back into a margin that works.
- **Hosting target.** Vercel for the Next.js app is the easy default, but consider a regional EA host or Cloudflare Pages for latency to East African users. Decide before Phase 2.
- **Password reset & phone-recovery flows.** Designed conceptually but not yet specified screen-by-screen. Must be done before any production launch (SIM swap fraud is a real risk on a phone-first auth product).
- **`toast` spec vs sonner.** Feature spec 01 lists `toast` as a shadcn primitive; shadcn deprecated `toast` in favour of `sonner`. Installed `sonner` instead. Feature spec should be updated when feature 01 is Shipped.
- **Clerk SMS cost:** Clerk uses Twilio (~3x more expensive than Africa's Talking per Uganda SMS). Acceptable at MVP scale; re-evaluate at 1,000+ MAU.
- **Clerk MAU billing:** Clerk is free to 10k MAU. Define what triggers an auth-cost review and what the migration path looks like.

## Architecture Decisions

- **Next.js App Router over Pages Router.** Chosen because Server Components reduce client JS bundle size (matters on 3G), built-in API routes mean no separate backend at MVP, and the file-based routing maps cleanly to the `/[username]` and `/[username]/donate` public pages.
- **Postgres via Prisma over raw SQL / Drizzle.** Prisma's schema-first model and migration tooling are friendlier for solo dev velocity. Drizzle is faster at runtime but adds complexity we don't need yet. Easy to migrate later if needed.
- **Redis for OTP storage, not Postgres.** OTPs auto-expire via Redis TTL — no cleanup cron, no stale rows. Also faster for rate-limiting counters by IP and by phone.
- **Clerk handles password storage and reset.** Password hashing, verification, and account recovery are managed by Clerk. Our app stores `clerk_user_id` and product state, not local password hashes.
- **Africa's Talking over Twilio for SMS.** Cheaper in EA (~UGX 32/SMS vs Twilio's ~UGX 100+), better Uganda delivery rates, sender ID branding available through their UCC application process. Build a `SmsProvider` interface to keep Twilio as a future fallback for cross-border. `africastalking@0.7.9` installed (Phase 1, anticipatory). Known: transitive `axios`/`lodash` audit warnings — acceptable risk until Feature 17 is wired; consider replacing with a direct `fetch` implementation in `lib/sms.ts` to avoid the axios dependency entirely.
- **Clerk over custom auth.** Decided 2026-05-18. Original plan was custom phone-OTP auth via Africa's Talking with argon2id passwords and server sessions. Switched to Clerk to save 2-3 weeks. Trade-offs accepted: vendor dependency, per-MAU cost above 10k users, Twilio (not Africa's Talking) under the hood for auth SMS. Africa's Talking remains for donation notification SMS only.
- **Direct-to-creator MoMo settlement.** Funds land in creator's registered MoMo number; platform fee split off via API. Avoids holding customer funds (which triggers BoU payment aggregator licensing). Trade-off: requires creators to be KYC-verified by MTN/Airtel before they can receive — design assumes that.
- **Mobile-first, responsive web only (no native apps at MVP).** Most users will visit via shared links on mobile browsers; building two native apps doubles cost for marginal early benefit. PWA install banner can come in Phase 2.
- **Phone hard / email soft verification.** Phone is required to be verified before public page goes live or any sensitive action. Email is soft-required — gates donations and money-related actions only. Reduces signup friction without compromising security where it matters.
- **Reserved usernames as a database table, not a hardcoded list.** Allows runtime updates without redeploy and supports the admin review queue for claim requests (`username_claims` table).
- **Sessions via httpOnly secure cookies, not JWTs in localStorage.** Cookies are simpler for MVP, easy to revoke server-side, and not vulnerable to XSS-based token theft. Move to JWTs only if we need to support a separate native client later.
- **No native dark mode at MVP.** Saves ~20% of component work. Pro-tier feature in Phase 2.
- **Tailwind CSS v4 (no tailwind.config.ts).** This Next.js version ships with Tailwind v4. All theme extensions (color tokens, font mappings) live in `app/globals.css` under `@theme inline`. No config file — the CSS is the config.
- **shadcn `sonner` instead of `toast`.** The `toast` component is deprecated in recent shadcn. `sonner` is the replacement — same trigger API, better defaults. Feature spec 01 will be updated when shipped.

## Session Notes

- The signup page React component lives in the conversation history (also exported as `SubtreeSignup.jsx`). When porting to Next.js, convert to TSX, replace `RESERVED_USERNAMES` / `TAKEN_USERNAMES` constants with API calls, replace `setTimeout` simulation with real fetch to `/api/auth/signup`, and split `OTPScreen` into its own route at `app/(auth)/signup/verify/page.tsx`.
- `docs/CLAUDE.md` holds the read-order manifest. `docs/UI_CONTEXT.md` holds the design system. `docs/ARCHITECTURE.md` holds stack and invariants. `docs/STANDARDS.md` holds code rules. `docs/WORKFLOW.md` holds the development workflow. This file holds the running progress log.
- Visual style decided after iteration: clean white/neutral SaaS aesthetic, no regional or earth-tone branding. Don't reintroduce decorative or culturally-themed visuals unless explicitly requested.
- When working on the donation page, remember the public profile page comes first — the donate button on the profile page is the entry point. Don't build the donation page in isolation.
- East African mobile context matters for performance: target 3G load times, keep bundles small, use Next.js Server Components by default and `'use client'` only when interactivity requires it.
- Brand wordmark renders as "Sub-tree" with a hyphen in URLs and on the website. The visual logo mark is a small abstract tree-branch icon in a dark rounded square — defined in `components/brand/Logo.tsx`.
- Muhamad is the founder and primary developer, building self-funded. No team to coordinate with at this stage — single-developer pacing and decisions.
- The `context/` folder in the project root exists but is empty. Per `docs/CLAUDE.md`, context files are intended to live at `context/*.md` (not `docs/*.md`). This migration has not been done yet — all context is still in `docs/`. Do not confuse the two.
- **`secondary` text color (#4b5563) is NOT mapped to a Tailwind utility** to avoid collision with shadcn's `bg-secondary` (which is the surface color). Use `text-[color:var(--text-secondary)]` in components. Per STANDARDS.md, this inline var syntax is explicitly allowed.
