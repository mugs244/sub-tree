# 41 — Content Houses (Multi-User Accounts)

## Status

Proposed — BLOCKED until: Features 37, 38, 39, 40 ship AND Liveblocks is installed per `docs/pending-dependencies.md`.

## Date

2026-05-21

## Context Links

- `docs/PROJECT-OVERVIEW.md` — Content House tier scope
- `docs/ARCHITECTURE.md` — Invariant 5 (single owner) — this feature replaces it
- `docs/v2/V2-ARCHITECTURE.md` — Invariant change documentation, role permissions, realtime considerations
- `docs/v2/features/37-pro-themes.md` through `40-affiliate-network.md` — feature inheritance
- `docs/pending-dependencies.md` — Liveblocks entry

Read those first. This file documents the largest architectural change in v2.

## Why

Content houses, agencies, bands, podcast networks, and NGOs don't have one person managing their online presence — they have a team. v1 forces them to share a single login (insecure, untraceable, conflict-prone) or each manage their own profile (loses the shared brand).

Content House is its own tier, not an add-on. It includes everything in Pro and Business plus:

- Up to ~10 members per house with role-based access
- Each member has their own portal within the house
- Unified group overview combining everyone
- Group + individual links
- Donations route to the group OR to a specific member
- Per-member percentage splits for group donations
- Shared shop, fundraisers, affiliate relationships
- Real-time multi-user editing via Liveblocks

This is the largest architectural change in v2. It replaces the single-owner invariant. Do not start before v2 has shipped its other features and at least one real content house is paying for it.

## User Flow

### House creation

1. A user upgrades to Content House tier via v1 Feature 20 (Pro billing extended)
2. They become the OWNER of a new team automatically
3. They set the house's handle, display name, bio, avatar — these become the public-facing identity
4. They invite members by handle or phone number

### Member invitation

1. Owner enters target user's handle or phone
2. If they're an existing Sub-tree user: invitation sent in-app + SMS
3. If they're not: SMS invites them to sign up; on signup, they auto-join the house
4. Invitee sees pending invitation in their dashboard
5. Accepting joins the team with role set by owner (default: MEMBER)

### Role assignment

Owner can assign roles per the matrix in `V2-ARCHITECTURE.md`:

- **OWNER**: full control, billing, can delete house (only one per house)
- **ADMIN**: manage links/products/fundraisers, approve affiliates, but can't add/remove members or change splits
- **EDITOR**: edit profile, links, products, fundraisers — but no admin powers
- **MEMBER**: read-only on shared resources, receives donation share
- **VIEWER**: read-only on dashboard, no donation share

### Member's own portal

Each member sees TWO contexts in their account switcher:

1. **Solo context** — their personal Sub-tree profile (same as any non-house user)
2. **House context** — the shared content house dashboard

Switching contexts is a dropdown in the top nav. Solo work continues independently of house work.

### Public profile (the house's page)

- Lives at `sub-tree.com/[house-handle]`
- Shows house's display name, avatar, bio
- Below: collective link stack (mix of group links and member-attributed links)
- Optional "Members" section showing each member's avatar + handle, linking to that member's solo profile
- Donate button: opens choice screen — donate to the house OR to a specific member

### Group donation flow

1. Visitor taps donate → "Who would you like to support?"
2. Options: "The whole house" or "[specific member]"
3. **Whole house**: payment routes to house's designated MoMo number; per-member split distribution happens via a separate batch action (manual by owner or scheduled weekly)
4. **Specific member**: payment routes directly to that member's MoMo number, bypassing the house

### Per-member split configuration (Owner only)

- Owner sets percentage per member (e.g., 4-person band: 25/25/25/25 or 40/30/20/10)
- Percentages must sum to 100
- Split applies to group donations going forward
- Past donations are not retroactively re-split

### Group shop, fundraisers, affiliates

- All inherit the house tier (Business + Pro features)
- Products, fundraisers, affiliate relationships are owned by the house, not individual members
- Any EDITOR+ can create products/fundraisers; the house is the seller of record
- Order revenue routes to the house's MoMo number
- Owner can configure separate split rules for shop revenue if desired (default: same as donation split)

### Live multi-user editing

- When two members open the dashboard's links manager simultaneously, both see a presence indicator: "Sarah is editing"
- Edits sync in real time via Liveblocks
- No conflict resolution UX needed at MVP — last write wins
- Activity feed in dashboard shows every action: "Sarah added a link", "John changed the theme color"

### Member departure

1. Member voluntarily leaves OR Owner removes them
2. Their access to house dashboard is revoked immediately
3. Their personal solo profile is unaffected
4. Their contributions to the house (products they uploaded, links they added, donations they helped attract) are SOFT-ARCHIVED — preserved in the database, marked with `archived_at`, hidden from active UI
5. Their share of pending split distributions is held in escrow for 30 days, then released to the house owner if no claim
6. Active orders they were attributed as affiliate for: continue normally; their commission still pays out

## What Changes

### Major changes
- Single-owner invariant REPLACED — see V2-ARCHITECTURE
- New auth context layer: every authenticated action checks "in solo or house context, what role do I have here"
- Public profile rendering: house profiles look different (avatar grid for members, donation routing choice)
- Donation flow gains "to whole house or member" routing
- All v2 features (37, 38, 39, 40) get a `team_id` column to mark resources as house-owned
- Liveblocks integration at dashboard level
- Activity audit log

### Modified behavior
- `User` model gains `current_team_id` (which context they're working in)
- Auth helper in `lib/auth/` returns `{ userId, currentTeamId, role }` instead of just `{ userId }`
- All resource ownership checks become two-step: "is this resource owned by a team? if so, is the user a member with appropriate role?"

### Unchanged
- Solo creators continue working exactly as before
- Free, Pro, Business tiers are unaffected
- v1 features 03-23 don't need code changes — the team layer is opt-in via tier

## Data Model Changes

```prisma
model Team {
  id              Int       @id @default(autoincrement())
  handle          String    @unique
  display_name    String
  bio             String?   @db.Text
  avatar_url      String?
  owner_user_id   Int
  payout_phone    String?   // house's designated MoMo number
  status          TeamStatus @default(ACTIVE)
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  deleted_at      DateTime?

  owner           User      @relation("team_owner", fields: [owner_user_id], references: [id])
  members         TeamMembership[]
  donation_splits TeamDonationSplit[]
  audit_log       TeamAuditLog[]

  @@index([handle])
  @@index([owner_user_id])
}

model TeamMembership {
  id          Int        @id @default(autoincrement())
  team_id     Int
  user_id     Int
  role        TeamRole
  invited_by  Int        // user_id of inviter
  invited_at  DateTime   @default(now())
  joined_at   DateTime?
  left_at     DateTime?
  status      MembershipStatus @default(PENDING)

  team        Team       @relation(fields: [team_id], references: [id], onDelete: Cascade)
  user        User       @relation("team_memberships", fields: [user_id], references: [id])

  @@unique([team_id, user_id])
  @@index([team_id])
  @@index([user_id])
  @@index([status])
}

model TeamDonationSplit {
  id          Int       @id @default(autoincrement())
  team_id     Int
  user_id     Int       // the member receiving this share
  percentage  Int       // 0-100; all percentages for a team must sum to 100
  effective_from DateTime @default(now())

  team        Team      @relation(fields: [team_id], references: [id], onDelete: Cascade)
  user        User      @relation("split_member", fields: [user_id], references: [id])

  @@unique([team_id, user_id])
  @@index([team_id])
}

model TeamAuditLog {
  id              Int       @id @default(autoincrement())
  team_id         Int
  actor_user_id   Int
  action          String    // e.g. "LINK_CREATED", "MEMBER_INVITED", "SPLIT_UPDATED"
  resource_type   String?   // e.g. "link", "product", "fundraiser"
  resource_id     Int?
  metadata        Json?
  created_at      DateTime  @default(now())

  team            Team      @relation(fields: [team_id], references: [id], onDelete: Cascade)
  actor           User      @relation("audit_actor", fields: [actor_user_id], references: [id])

  @@index([team_id, created_at])
}

enum TeamStatus       { ACTIVE SUSPENDED DELETED }
enum TeamRole         { OWNER ADMIN EDITOR MEMBER VIEWER }
enum MembershipStatus { PENDING ACTIVE LEFT REMOVED }
```

Add `team_id` (nullable) to:

- `Profile` (a profile can be team-owned)
- `Link` (a link can be team-owned)
- `Product` (a product can be team-owned)
- `Fundraiser` (a fundraiser can be team-owned)
- `AffiliateRelationship` (the shop side can be team-owned)
- `Donation` (a donation can target a team OR a team-member)

Add to `User`:
- `current_team_id Int?` — which context the user is currently working in (null = solo)

Add to `Donation`:
- `team_id Int?` — set when donation goes to a team (whole house)
- `recipient_user_id Int?` — set when donation goes to a specific team member (bypasses split)

Migration: `feature_41_content_houses`

## API Surface

```
# Team management
POST   /api/teams                              — create team (Content House tier required)
GET    /api/teams/[id]                         — team details
PATCH  /api/teams/[id]                         — update team profile (Owner/Admin)
DELETE /api/teams/[id]                         — delete team (Owner only)

# Membership
POST   /api/teams/[id]/invite                  — invite by handle or phone (Owner)
POST   /api/teams/invitations/[id]/accept      — accept invitation
POST   /api/teams/invitations/[id]/decline     — decline invitation
PATCH  /api/teams/[id]/members/[userId]/role   — change role (Owner)
DELETE /api/teams/[id]/members/[userId]        — remove member (Owner)
POST   /api/teams/[id]/leave                   — member voluntarily leaves

# Donation splits
GET    /api/teams/[id]/splits                  — current split config
PUT    /api/teams/[id]/splits                  — update splits (Owner, must sum to 100)

# Context switching
PATCH  /api/me/context                         — switch between solo and team context

# Audit log
GET    /api/teams/[id]/audit                   — activity feed (filterable by actor, action, date)

# Public
GET    /api/public/teams/[handle]              — team profile data
GET    /api/public/teams/[handle]/members      — team member list with handles
```

All v2 feature endpoints (37, 38, 39, 40) gain team-context handling: the route checks current user's `current_team_id` to determine ownership of created resources.

## UI Changes

### Account switcher (top nav)
- Avatar dropdown shows:
  - "Solo profile" (the user's personal context)
  - "[Team name]" for each team they're a member of
  - "Switch context" highlights the active one
- Switching reloads the dashboard with the new context

### Team dashboard (when in team context)
- Same overall layout as solo dashboard
- Top bar shows team name + role indicator
- All resource lists (links, products, fundraisers, donations, affiliates) show team-owned items
- Members tab: list of all members with avatars, roles, "Invited by" info
- Splits tab (Owner only): per-member percentage configuration
- Activity tab: audit log with filters
- Settings tab: team profile, payout phone, danger zone (delete team — Owner only)

### Live editing indicators (Links manager, Profile editor)
- Liveblocks presence shown as small avatar stack in corner: "Sarah, John editing"
- When two users edit the same link simultaneously, last write wins with subtle "John just updated this" toast

### Public team profile (`sub-tree.com/[house-handle]`)
- House avatar, display name, bio
- Members grid (avatars with handles, linking to each member's solo profile)
- Link stack (shared house links + optionally member-attributed links)
- Shop section (house-owned products)
- Fundraiser cards (house-owned)
- Donate button → "Support [house]" or "Support a specific member"

### Donation routing screen (when "Support" tapped)
- Visitor sees: "Donate to [house name]" (whole house, split applied) — primary CTA
- Below: "Or support a specific member" — small avatars linking to individual donation flows
- Both flows use the same Pesapal/OpenFloat integration

## Scope

### In scope
- Team creation, invitation, membership
- 5 roles with the permission matrix from V2-ARCHITECTURE
- Per-member donation split configuration (sums to 100)
- Donation routing (whole house OR specific member)
- Team-owned profiles, links, products, fundraisers, affiliate relationships
- Account context switcher
- Audit log for all team mutations
- Liveblocks integration at dashboard level
- Public team profile page with members grid
- Member departure with soft-archive of contributions
- 30-day escrow on pending split distributions for departed members

### Out of scope
- Cross-team transfers (move a product from team A to team B)
- Public team pages separate from individual member profiles (already covered above)
- Per-link permissions (e.g., "only John can edit this specific link") — too granular
- Custom roles beyond the 5 defined
- Sub-teams or nested teams
- Team-to-team affiliate relationships (team-to-individual works; team-to-team is post-v2)
- Automated dispute resolution for departed-member contribution claims
- Migration from solo to team (in v2, you create a team fresh — your solo profile becomes one identity within it; we don't auto-migrate links/products from solo to team)

## Success Criteria

1. A Content House tier user can create a team, invite 2 other Sub-tree creators, and assign them roles
2. Members can switch between their solo context and team context via the account switcher
3. Owner can configure 4-member splits (e.g., 40/30/20/10) and a group donation routes correctly to the house wallet, then distributes to members per the configuration
4. A visitor on the public team page can choose to donate to the whole house OR to a specific member, and funds route correctly in each case
5. Two members simultaneously editing the team's links manager see each other's presence and changes sync within 1 second
6. Audit log records every mutation with actor, action, resource, timestamp
7. When a member leaves, their access is revoked immediately and their contributions are soft-archived (not deleted)

## New Invariants

Honors v2 Invariant 4 (Content House donations route through the house wallet).

Service-level rules:
- Team membership status transitions are append-only: PENDING → ACTIVE → (LEFT | REMOVED). A removed member can be re-invited (creates a new TeamMembership row).
- Donation split percentages must always sum to 100 — enforced at API level when Owner updates splits.
- A user can be a member of multiple teams simultaneously but only one team is their `current_team_id` at any time.
- Liveblocks state is ephemeral — source of truth remains Postgres. Liveblocks just syncs UI presence and in-flight edits.
- Team deletion is soft (sets `deleted_at`). All financial records (donations, orders, payouts) referencing the team are preserved.

## Open Questions

- Maximum members per house: 10 suggested. Confirm.
- What if a Content House owner stops paying? Recommend: revert to read-only after grace period, members still see history but can't edit; if not resolved in 90 days, archive and split final balance.
- Can a Content House have its own affiliate relationships (the house as the affiliate)? Recommend yes — Feature 40 already supports any tier as affiliate.
- Liveblocks pricing at scale: free tier is 50 MAU. At 100 paying content houses with 5 members each, that's 500 MAU. Paid tier costs need projecting before launch.
- Member who leaves and wants to claim their archived contributions back (e.g., a designer leaves and wants their product designs): out of scope for v2. Document this in tier marketing — contributions to a content house become house property.

## Migration Plan

Net new feature. No existing data affected. Solo creators continue working with no changes.

Existing v2 features (37, 38, 39, 40) need `team_id` columns added in a coordinated migration. This is the largest schema change in v2 — handle carefully:

1. Add nullable `team_id` columns to all affected tables in one migration
2. Existing rows get `team_id = NULL` (solo-owned)
3. Future inserts can populate `team_id` if the resource is team-owned
4. Ownership-check logic gains team-context branch

This migration is reversible (drop the columns) since no existing data uses them.
