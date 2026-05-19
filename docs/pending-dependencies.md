# Pending Dependencies

Tools and services evaluated for Sub-tree but not currently in the codebase. This document captures the decision, the trigger conditions, and the install notes so we do not re-evaluate the same options every time.

## Liveblocks

**What:** Realtime collaboration infrastructure for multiplayer cursors, presence, shared state, and live comments.

**Use case for Sub-tree:** Team accounts / content houses where multiple users edit one profile (Feature 31).

**Why deferred:** No multi-user resources exist at MVP. The product is single-owner per profile today, and the ARCHITECTURE invariant explicitly keeps the MVP single-owner.

**Install when:**
- MVP has shipped and accumulated 6+ months of usage
- Pro tier is live and validated as revenue
- At least one content house has explicitly requested team functionality and is ready to pay

**Install command (when ready):**
  npm install @liveblocks/client @liveblocks/react @liveblocks/react-comments

## Trigger.dev

**What:** Background job orchestration and async worker platform for server-side workflows.

**Use case for Sub-tree:** Async job processing at scale — donation webhook reconciliation, email receipts, retryable payout jobs, and other long-running background work.

**Why deferred:** MVP can stay synchronous or use simple server-side retries and webhooks. Trigger.dev is an ops dependency that should only be added when async workflow volume justifies it.

**Install when:**
- MVP is live and donation / webhook volume exceeds what lightweight server handlers can reliably support
- A concrete async workflow exists that cannot be safely handled in the existing request/response lifecycle
- The cost and operational overhead of Trigger.dev are justified by improved reliability and developer velocity

**Install command (when ready):**
  npm install @trigger.dev/sdk @trigger.dev/nextjs

## Process

1. Check this file before installing a new package or SaaS service.
2. If a dependency is already listed, follow the existing trigger conditions rather than re-evaluating it.
3. If the dependency is new and anticipatory, add it here with the same format: What, Use case, Why deferred, Install when, Install command.
4. If the dependency is installed, update `docs/ARCHITECTURE.md` and `docs/PROGRESS.md` in the same commit.
