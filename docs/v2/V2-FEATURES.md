# v2 Features — Master Index

The canonical index of v2 features. Each row points to a feature file in `docs/v2/features/`.

This is parallel to `docs/features-specs.md` (v1). v1 features keep their numbers (01-36). v2 features start at 37 and continue.

## Status Legend

Same as v1:

- **Proposed** — spec exists, not yet greenlit
- **Greenlit** — approved to build, waiting in queue
- **In Progress** — actively being built
- **Shipped** — live in production, absorbed into v2 baseline
- **Deferred** — scope valid, not now
- **Deprecated** — was shipped, now removed/replaced
- **Superseded** — replaced by another feature file

## Feature Index

| # | Feature | Tier | Status | Depends On | File |
|---|---|---|---|---|---|
| 37 | Pro Themes & Extended Colors | Pro | Proposed | v1: 11, 20 | `docs/v2/features/37-pro-themes.md` |
| 38 | Fundraiser | Pro | Proposed | v1: 15, 16, 20 + v1 Feature 36 | `docs/v2/features/38-fundraiser.md` |
| 39 | Shop (Digital + Physical) | Business | Proposed | v1: Feature 36 + v2 Pesapal escrow confirmation | `docs/v2/features/39-shop.md` |
| 40 | Affiliate Network | Pro, Business, CH | Proposed | Feature 39 | `docs/v2/features/40-affiliate-network.md` |
| 41 | Content Houses | Content House | Proposed | Features 37, 38, 39, 40 + Liveblocks integration | `docs/v2/features/41-content-houses.md` |
| 42 | Smart Link Types | All tiers | Proposed | v1: 10 | `docs/v2/features/42-smart-link-types.md` |

## Build Order

Recommended (lowest risk first):

1. **37 — Pro Themes** (1 week) — validates Pro tier upgrade path
2. **42 — Smart Link Types** (1 week) — benefits all tiers, builds engagement signal
3. **38 — Fundraiser** (2 weeks) — second Pro upgrade reason, validates campaign model
4. **39 — Shop** (3-4 weeks) — biggest feature, introduces Business tier and escrow
5. **40 — Affiliate Network** (2 weeks) — depends on Shop existing
6. **41 — Content Houses** (4-5 weeks) — largest architectural change, do last

Total estimated v2 build: 13-15 weeks of focused development.

## Gates and Blockers

Before specific features can start:

- **Feature 39 (Shop)** is BLOCKED until Pesapal merchant onboarding confirms their license covers escrow + split flows. If their license does not cover this, Shop scope must be restructured to direct-settlement-only or v2 pauses until Sub-tree obtains its own BoU payment aggregator license.
- **Feature 40 (Affiliate)** is BLOCKED until Feature 39 ships and produces real `Order` records.
- **Feature 41 (Content Houses)** is BLOCKED until Liveblocks is installed (see `docs/pending-dependencies.md`) and Features 37, 38, 39, 40 have shipped. Content Houses inherit all of them — building before they exist creates redundant work.

## Deferred (NOT in v2)

The following were discussed but deferred. Captured in personal notes:

- **Make-a-Wish (personalized video)** — needs market validation experiment before specification
- **Subscription Content (Patreon-style)** — recurring billing on MoMo is genuinely hard
- **Multi-level affiliate** (affiliates of affiliates) — fraud risk too high
- **Cross-platform affiliate network** (non-Sub-tree shops) — out of v2 scope
- **Sub-tree-issued tickets** (with capacity management, QR codes) — Sub-tree processes payments only; ticket logic stays with the creator or external platform
- **Card payments as a primary surface** — MoMo-first market
- **Native iOS/Android apps** — still responsive web only

## How to Update This File

When a new v2 feature is proposed:

1. Append a row to the table with the next available number (v2 numbering continues from 42; v3 starts higher).
2. Create the feature file at `docs/v2/features/NN-name.md` using the standard template.
3. If the feature shifts the build order or unblocks/blocks another feature, update both the Build Order and Gates sections.
4. Commit the table row + the feature file in the same commit.

When a v2 feature ships:

1. Update its status to **Shipped** in this table.
2. Update `docs/PROGRESS.md`.
3. Absorb any new architectural decisions back into `docs/ARCHITECTURE.md` (not `docs/v2/V2-ARCHITECTURE.md` — once shipped, the architecture is just "the architecture").
4. The feature file in `docs/v2/features/` stays as historical record.
