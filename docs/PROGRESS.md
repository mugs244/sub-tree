# Progress Tracker

Update this file after every meaningful implementation change. Treat it as the running log of what's done, what's next, and what context the next session needs to resume cleanly.

## Current Phase

Phase 0: Foundations — Design System Setup (feature 01) underway.

## Current Goal

Implement feature 01 (Design System Setup): full token set in globals.css, Tailwind v4 theme mapping, shadcn/ui initialized with project tokens, Logo component, AuthLayout and DashboardLayout shells, and /dev/design-system smoke-test route.

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
- **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 project scaffolded.** (Note: project was initialized as Next.js 16, not v14 as originally planned. App Router conventions are the same; Tailwind CSS v4 uses CSS-based config with no tailwind.config.ts — all theme extensions go in globals.css via @theme inline.)

## In Progress

- **Feature 01 — Design System Setup.** Token set in `app/globals.css`, Tailwind v4 `@theme inline` mapping, shadcn/ui primitives (button, input, label, checkbox, select, dialog, sonner, drawer), `components/brand/Logo.tsx`, `components/layouts/AuthLayout.tsx`, `components/layouts/DashboardLayout.tsx` shell, `app/dev/design-system` route.

## Next Up

2. **Feature 01 — finish and verify.** Run `npm run build`, confirm `/dev/design-system` renders all tokens and primitives without errors, commit.
3. **Feature 02 — Database Schema & Prisma Setup.** Docker Compose for local Postgres, Prisma init, initial schema (`users`, `reserved_usernames`, `profiles`, `links`), seed script.
4. Set up Prisma + Postgres. Create `docker-compose.yml` for local Postgres. Generate initial schema: `users`, `reserved_usernames`, `profiles`, `links`.
5. Port the signup page from the designed component into `app/(auth)/signup/page.tsx` (convert JSX → TSX, replace simulated logic with real API calls).
6. Build `POST /api/auth/signup` — Zod validation, argon2 password hashing, reserved-name check, user insert, OTP generation (log to console until Redis is wired).
7. Build `GET /api/auth/check-username` — live availability endpoint.
8. Move OTP screen to `app/(auth)/signup/verify/page.tsx`. Build `POST /api/auth/verify-otp` endpoint.
9. Wire Redis (via Upstash or local Docker) for OTP storage with TTL.
10. Wire Africa's Talking SMS for real OTP delivery. Test end-to-end signup flow.
11. Build quick-profile screen (display name + avatar) and "add first link" screen.
12. Build dashboard shell with nav (sidebar on desktop, bottom tabs on mobile).

## Open Questions

- **Domain availability not yet confirmed.** Need to verify `sub-tree.com` and `sub-tree.ug` are actually available and register them. Recommend Cloudflare Registrar for `.com` and a Ugandan registrar (Hostalite, Truehost) for `.ug`.
- **MoMo API onboarding not yet started.** MTN MoMo Collections and Airtel Money production access take 2–6 weeks each. Need to start the merchant applications now, in parallel with development, or the donation flow will be blocked when ready to integrate.
- **BoU regulatory question unresolved.** Receiving donations on behalf of creators may trigger Bank of Uganda payment aggregator licensing under the National Payment Systems Act, 2020. Direct-to-creator settlement is the planned mitigation, but worth a consultation with a payments-savvy Ugandan lawyer before launch.
- **Pro tier pricing not yet tested.** Working assumption is UGX 10,000–15,000/month. Validate with a small group of target creators before committing.
- **Fee structure final numbers.** Working assumption is 5% on free tier, 3% on Pro. Need to confirm what MTN/Airtel MoMo charge us first, then back into a margin that works.
- **Hosting target.** Vercel for the Next.js app is the easy default, but consider a regional EA host or Cloudflare Pages for latency to East African users. Decide before Phase 2.
- **Password reset & phone-recovery flows.** Designed conceptually but not yet specified screen-by-screen. Must be done before any production launch (SIM swap fraud is a real risk on a phone-first auth product).
- **`toast` spec vs sonner.** Feature spec 01 lists `toast` as a shadcn primitive; shadcn deprecated `toast` in favour of `sonner`. Installed `sonner` instead. Feature spec should be updated when feature 01 is Shipped.

## Architecture Decisions

- **Next.js App Router over Pages Router.** Chosen because Server Components reduce client JS bundle size (matters on 3G), built-in API routes mean no separate backend at MVP, and the file-based routing maps cleanly to the `/[username]` and `/[username]/donate` public pages.
- **Postgres via Prisma over raw SQL / Drizzle.** Prisma's schema-first model and migration tooling are friendlier for solo dev velocity. Drizzle is faster at runtime but adds complexity we don't need yet. Easy to migrate later if needed.
- **Redis for OTP storage, not Postgres.** OTPs auto-expire via Redis TTL — no cleanup cron, no stale rows. Also faster for rate-limiting counters by IP and by phone.
- **Argon2id over bcrypt for password hashing.** Argon2 is the modern recommendation (winner of the Password Hashing Competition), better resistance to GPU/ASIC attacks. The `argon2` Node package wraps the reference implementation.
- **Africa's Talking over Twilio for SMS.** Cheaper in EA (~UGX 32/SMS vs Twilio's ~UGX 100+), better Uganda delivery rates, sender ID branding available through their UCC application process. Build a `SmsProvider` interface to keep Twilio as a future fallback for cross-border.
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
