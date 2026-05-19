# 03 — Clerk Auth Integration

## Status

Proposed

## Date

2026-05-18

## Context Links

- docs/CLAUDE.md — Authentication & Account features
- docs/ARCHITECTURE.md — Auth and Access Model section
- docs/STANDARDS.md — API Routes auth pattern
- docs/features/01-design-system.md — Clerk components themed to match design tokens

## Why

Building custom auth is 2-3 weeks of work that's not Sub-tree's differentiation. Clerk handles all of it with a managed service, free up to 10,000 MAU. Trading auth code for a vendor relationship is the right call for an MVP whose value lives in link aggregation and mobile money donations.

## What This Sets Up

- Clerk Next.js SDK installed and configured
- Signup configured for phone (primary) + email (required), with phone OTP
- Middleware protecting /dashboard/** routes; public access to /[username] paths
- Webhook from Clerk to our backend that creates a users row on signup
- Local users table linked to Clerk via clerk_user_id foreign key
- Sign-out flow that clears Clerk session

## Implementation

### Install

If Clerk is not already installed:
  npm install @clerk/nextjs

### Environment variables

Add to .env.local:
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
  CLERK_SECRET_KEY=sk_test_...
  CLERK_WEBHOOK_SECRET=whsec_...
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding/username
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard

Add same keys (without values) to .env.example.

### ClerkProvider

In app/layout.tsx, wrap body in ClerkProvider with appearance theming:

  <ClerkProvider
    appearance={{
      variables: {
        colorPrimary: "var(--accent-primary)",
        colorBackground: "var(--bg-base)",
        colorText: "var(--text-primary)",
        colorInputBackground: "var(--bg-raised)",
        borderRadius: "0.5rem",
        fontFamily: "var(--font-sans)",
      },
    }}
  >

### Middleware

Create middleware.ts at project root:

  import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

  const isProtectedRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/onboarding(.*)",
    "/api/links/(.*)",
    "/api/donations/list",
    "/api/settings/(.*)",
  ]);

  export default clerkMiddleware((auth, req) => {
    if (isProtectedRoute(req)) auth.protect();
  });

  export const config = {
    matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js|jpg|png|svg|woff2?|ico)).*)"],
  };

### Sign-up and sign-in pages

Create app/sign-up/[[...sign-up]]/page.tsx with Clerk's SignUp component centered on the page. Same pattern for app/sign-in/[[...sign-in]]/page.tsx with SignIn.

### Clerk dashboard config

In the Clerk dashboard:
1. User & Authentication → Email, Phone, Username: phone required and primary; email required; disable Clerk's username (we handle it).
2. Multi-factor: enable SMS code.
3. Sessions: 7-day lifetime.
4. Webhooks: add endpoint https://sub-tree.com/api/webhooks/clerk subscribed to user.created, user.updated, user.deleted. Copy signing secret.

### Webhook handler

Create app/api/webhooks/clerk/route.ts that:
- Verifies svix signature
- On user.created: inserts users row with clerk_user_id, phone, email
- On user.updated: updates phone, email, email_verified_at
- On user.deleted: soft-deletes (sets deleted_at)

Install svix: npm install svix

### Database schema

Update prisma/schema.prisma users model:

  model User {
    id                Int       @id @default(autoincrement())
    clerk_user_id     String    @unique
    username          String?   @unique
    phone             String?
    email             String?
    email_verified_at DateTime?
    account_type      AccountType @default(INDIVIDUAL)
    tier              Tier      @default(FREE)
    created_at        DateTime  @default(now())
    updated_at        DateTime  @updatedAt
    deleted_at        DateTime?

    profile           Profile?
    links             Link[]
    donations         Donation[]

    @@index([clerk_user_id])
  }

If existing schema has password_hash or argon2_hash columns, create a migration to drop them. If existing schema has phone_verified_at, drop it (Clerk owns this).

Run: npx prisma migrate dev --name switch-to-clerk-auth

## Scope

### In scope
- Clerk SDK and ClerkProvider
- Middleware for protected routes
- Sign-up and sign-in pages with themed components
- Webhook handler with svix verification
- Prisma schema migration
- .env.example documentation

### Out of scope
- Username claim flow (Feature 04)
- Profile setup (Feature 05)
- Dashboard pages (Feature 08)
- 2FA / TOTP (Phase 4+)
- Social logins (out of MVP scope)

## Success Criteria

1. New user can complete Clerk signup via phone + email, verify OTP, land at /onboarding/username
2. users row created in our DB within 5 seconds of Clerk signup via webhook
3. Visiting /dashboard signed out redirects to /sign-in
4. Visiting /[username] works without auth
5. Sign out clears session and redirects home
6. Clerk components visually match our design system

## Migration Notes

The current commit history added Clerk together with Liveblocks and Trigger.dev. This feature spec assumes Liveblocks and Trigger.dev have already been removed per docs/pending-dependencies.md. Verify before starting.

## Notes

The whole point is reducing work. Use Clerk's hosted components as-is, themed to match colors. Customize layout in a future polish pass only if creators find something confusing.
