# Sub-tree v2 — Overview

## Status

In planning. v2 begins after v1 launches and accumulates real user data. The v2 scope captured here represents current thinking. Actual build priorities will shift based on what v1 users ask for.

## What v2 Is

v2 transforms Sub-tree from a link-aggregator-with-donations into a creator economy platform. Where v1 lets a creator have one page that collects tips, v2 lets them run campaigns, sell products, build affiliate networks, and operate as a team.

The four-tier model in v2:

| Tier | Price (target) | Donations | Themes | Fundraiser | Shop | Affiliate (promoter) | Affiliate (merchant) | Multi-user |
|---|---|---|---|---|---|---|---|---|
| Free | UGX 0 | ✓ (5% fee) | Basic | — | — | — | — | — |
| Pro | ~UGX 15k/mo | ✓ (3% fee) | Custom | ✓ | — | ✓ | — | — |
| Business | ~UGX 40k/mo | ✓ (3% fee) | Custom | ✓ | ✓ | ✓ | ✓ | — |
| Content House | ~UGX 80k/mo | ✓ (3% fee) | Custom shared | ✓ shared | ✓ shared | ✓ | ✓ | ✓ (up to ~10 members) |

Smart link types (rich cards for pasted URLs) are free for all tiers — they benefit the whole platform.

## How v2 Inherits from v1

v2 does not replace v1 — it builds on top. The v1 architecture, design system, code standards, and workflow rules continue to apply. v2 introduces new concepts (teams, products, escrow, affiliate relationships, fundraiser declarations, smart cards) but does not break v1's foundations.

When a v1 invariant needs to change to accommodate v2 (notably: single-owner becomes shared-owner for Content Houses), the change is explicit and documented in `V2-ARCHITECTURE.md` — not hidden inside a feature file.

## Read Order

For Claude Code working on v2 features:

1. v1 base docs (`docs/CLAUDE.md`, `docs/PROJECT-OVERVIEW.md`, `docs/ARCHITECTURE.md`, `docs/UI_CONTEXT.md`, `docs/STANDARDS.md`, `docs/WORKFLOW.md`, `docs/PROGRESS.md`, `docs/features-specs.md`, `docs/pending-dependencies.md`)
2. v2 foundations (`docs/v2/V2-OVERVIEW.md`, `docs/v2/V2-ARCHITECTURE.md`, `docs/v2/V2-FEATURES.md`)
3. The specific v2 feature file being built

v1 docs describe the foundation. v2 docs describe the additions and modifications. Both apply together — v2 doesn't override v1, it extends it.

## What v2 Does NOT Include

These ideas were discussed and deferred from v2 explicitly:

- **Make-a-Wish (personalized video requests).** Captured in personal notes. Requires market validation experiment before specification — building it without testing demand is the same trap that kills Cameo-style platforms outside the celebrity tier.
- **Subscription Content (Patreon-style).** Recurring billing on MoMo is genuinely hard — MoMo doesn't have native auto-charge mechanics. Needs further evaluation. Captured for v3.
- **Multi-level affiliate.** Affiliate networks are flat. No affiliates-of-affiliates. Too much fraud risk, marginal value.
- **Cross-platform affiliate network.** Only Sub-tree creators affiliating with Sub-tree shops. No external integrations at v2.
- **Sub-tree-issued tickets with capacity management.** Sub-tree processes payments for events via the aggregator stack; ticket logic lives with the creator or external ticketing platforms. We render rich link cards for tickets but do not manage events ourselves.
- **Native iOS/Android apps.** Still responsive web only at v2.
- **Card payments.** MoMo-first market. Cards via Pesapal aggregator are technically possible but not surfaced as a primary path.

## Order of Build (current best guess)

1. **Feature 37 — Pro Themes** (1 week, highest ROI for least effort, validates Pro tier)
2. **Feature 42 — Smart Link Types** (1 week, benefits all tiers, builds engagement signal)
3. **Feature 38 — Fundraiser** (2 weeks, clear Pro upgrade reason, validates campaign model)
4. **Feature 39 — Shop** (3-4 weeks, biggest single feature, introduces Business tier and escrow)
5. **Feature 40 — Affiliate Network** (2 weeks, depends on Shop)
6. **Feature 41 — Content Houses** (4-5 weeks, largest architectural change, do last)

Total estimated v2 build: 13-15 weeks of focused development.

This order minimizes architectural disruption and lets early v2 work validate the tier model before the most complex feature (Content Houses) is built.

## Regulatory Flags

v2 features involving holding customer funds — Shop escrow, Affiliate batch payouts, Charity fundraiser splits — depend on Pesapal's BoU license covering Sub-tree's flows. Specifically:

- Pesapal holds the funds during shop escrow (we do not pool them in our accounts)
- Affiliate commissions are calculated and held within Pesapal's settlement layer, batch-released weekly to affiliate creators
- Charity fundraiser splits are configured at transaction time and settled directly to each party's MoMo number through Pesapal

This architecture keeps Sub-tree out of payment aggregator licensing entirely. **Confirm with Pesapal's compliance team during merchant onboarding** that their license covers the escrow + split flows v2 needs.

If Pesapal's license does NOT cover these flows, v2 either:
- Pauses for Sub-tree to obtain its own BoU license (months of work)
- Restructures Shop to direct-settlement-only (no escrow), accepting buyer-side risk

This is the single biggest open question for v2 and must be resolved before Feature 39 (Shop) begins.

## v2 Success Criteria

1. A Pro creator can apply a custom theme and a fundraiser to their public profile within 5 minutes of upgrading.
2. A Business creator can list a digital product, a fan can buy it via MoMo, funds settle to creator within the escrow auto-release window with no manual intervention.
3. A Pro creator can apply to be an affiliate for a Business shop, get approved, and earn commission on a sale within 2 weeks of joining the affiliate program.
4. A Content House with 3 members can share one profile, configure per-member donation splits, and collectively receive donations that route correctly per the split configuration.
5. Smart link types render correctly for at least 8 platforms (YouTube, Spotify, Instagram, TikTok, Twitter/X, ticketing platforms, podcast feeds, generic Open Graph fallback).
6. All v1 invariants that did not change explicitly in v2 still hold. No regressions in v1 functionality.

## Closing Note

v2 is ambitious. Six features, four new tiers, escrow flows, affiliate networks, team accounts. The most likely failure mode is trying to build all of it at once. The build order above is intentional: ship 37 (themes) and prove people upgrade to Pro before building everything else.

If after Pro Themes launches, fewer than 10% of active creators upgrade, stop and reconsider v2 entirely before building more.
