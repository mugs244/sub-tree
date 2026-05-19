# Deferred Dependencies

Tools and services we've evaluated, decided to use eventually, but are NOT in the codebase today. When their time comes, install per the notes below.

This list exists so we don't re-evaluate the same options every time someone has the thought "should we use X?" The decision is already made — we just haven't reached the trigger condition.

---

## Liveblocks

**What:** Realtime collaboration infrastructure (multiplayer cursors, presence, shared state, live comments).

**Use case for Sub-tree:** Team accounts / content houses where multiple users edit one profile (Feature 31).

**Why deferred:** No multi-user resources exist at MVP. Single-owner model per ARCHITECTURE.md invariant.

**Install when:**
- MVP has shipped and accumulated 6+ months of usage
- Pro tier is live and validated as revenue
- At least one content house has explicitly requested team functionality and is ready to pay

**Install command (when ready):**
