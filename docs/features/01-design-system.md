# 01 — Design System Setup

## Status

In Progress — implementation started 2026-05-18. Will move to Shipped when tokens are live, shadcn primitives installed, Logo + layout shells built, and /dev/design-system renders correctly.

## Date

2026-05-18

## Context Links

This feature establishes:
- `docs/UI_CONTEXT.md` — the design system specification. This file is the *implementation* of what UI_CONTEXT.md describes.
- `docs/STANDARDS.md` — Styling section. This work creates the tokens that the styling rules reference.
- `docs/ARCHITECTURE.md` — Stack section. Tailwind CSS and shadcn/ui are listed as the UI layer.

Read those files first. This file describes how the design system is technically implemented in code.

## Why

Every component built from now on must consume design tokens, not hardcoded values. If the design system isn't set up first, every component built before it will have to be migrated later — and migrations of styling are tedious, error-prone, and produce visual regressions. Doing this once, correctly, on day one means every subsequent component is consistent by construction. It also forces early answers to questions ("what does the focus ring look like? what's the disabled state color?") that would otherwise be invented ad hoc per component.

## What This Sets Up

### Design tokens as CSS custom properties
A single file (`app/globals.css`) declares every color, every typography variable, and every shared property the app uses. Every component reads from these tokens.

### Tailwind extended to map tokens to utility classes
The Tailwind config exposes the tokens as named utility classes (`bg-base`, `text-primary`, `border-default`) so component code stays readable instead of littered with `var(--token-name)` calls.

### Font loading via next/font
Geist Sans and Geist Mono load through `next/font/google` for zero layout shift and self-hosted optimization. CSS variables expose them so Tailwind utilities (`font-sans`, `font-mono`) resolve correctly.

### shadcn/ui initialized and theme-aware
shadcn/ui primitives are installed with the project's tokens, not the shadcn defaults. When you generate a new shadcn component, it inherits the brand colors automatically without manual override.

### Brand logo component
A reusable `<Logo />` component in `components/brand/Logo.tsx` so the wordmark and icon mark are consumed identically everywhere — auth pages, dashboard header, public profile footer.

### Reusable layout primitives
Two layouts that most pages will use: `<AuthLayout />` (centered single-column for signup/login/verify) and `<DashboardLayout />` (sidebar on desktop, bottom tabs on mobile). Built once, used everywhere.

## Scope

### In scope for this unit

- Create `app/globals.css` with the full token set from `UI_CONTEXT.md`.
- Extend `tailwind.config.ts` to map tokens to utility class names.
- Configure `next/font` for Geist Sans and Geist Mono in `app/layout.tsx`.
- Install and initialize shadcn/ui with project tokens.
- Add baseline shadcn primitives: `button`, `input`, `label`, `checkbox`, `select`, `dialog`, `toast`, `drawer`.
- Build `components/brand/Logo.tsx` (icon-only, wordmark-only, and lockup variants).
- Build `components/layouts/AuthLayout.tsx`.
- Build `components/layouts/DashboardLayout.tsx` shell (nav skeleton, no actual nav content yet).
- Add a `/dev/design-system` route that renders every token, every typography style, and every primitive on one page — visual regression smoke test and documentation in one.

### Out of scope for this unit

- Actual dashboard nav links (added when the dashboard is built).
- Dark mode tokens (Pro tier, Phase 2).
- Page-specific components (`LinkCard`, `DonationSheet`, `UsernameInput`) — those are built as their features are built.
- Custom theme system for Pro creators (separate feature spec).
- Animations beyond what shadcn provides out of the box.
- Icon set installation — Lucide React is installed but no icon-specific work yet.

## Implementation

### File: `app/globals.css`

```css