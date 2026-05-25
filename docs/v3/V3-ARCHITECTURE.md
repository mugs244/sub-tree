# Sub-tree v3 — Architecture Additions

This file describes what changes in the architecture for v3.
Both `docs/ARCHITECTURE.md` (v1) and `docs/v2/V2-ARCHITECTURE.md` continue to apply.
This file documents v3-specific additions only.

## Stack Additions in v3

| Layer | Technology | Role | When introduced |
|---|---|---|---|
| Subscription billing | Pesapal recurring / manual renewal | Monthly subscription payments | Feature 51 |
| Feed/activity system | Postgres `FeedEvent` table + polling | Fan feed of followed creator activity | Feature 45 |
| Post media storage | Vercel Blob (extends v2 use) | Creator post images (max 4 per post, max 1MB each after compression) | Feature 61 |
| Real-time chat (future) | Polling at v3 launch; Liveblocks upgrade later | Creator-to-fan DM delivery | Feature 62 |
| Platform settings cache | In-memory 5-min cache on PlatformSetting reads | Avoid DB hit on every fee calculation | Feature 63 |

## Invariant Changes from v1/v2

### v1 Invariant 5 update (already revised in v2, further clarified in v3)

**v3 clarification:**

> Every resource belongs to EITHER a single user (Fan or Creator) OR a team
> (Content House). Fan accounts (account_type = FAN) own only fan-side resources
> (FanProfile, Follow, FeedEvent reads). Creator resources (Profile, Link, Donation,
> Product, Fundraiser) belong to creator-tier accounts. account_type gating is
> enforced at the service layer on every mutation.

## New v3 Invariants

**v3 Invariant 1: Signup creates a Fan account by default.**
Every new Clerk user who completes onboarding gets `account_type = FAN`.
The creator dashboard and creator-specific API routes are inaccessible to FAN
accounts. The system never auto-upgrades a FAN — upgrade is always an explicit
user action via the "Become a creator" flow.

**v3 Invariant 2: Fan and creator contexts share one identity.**
A user who upgrades from FAN to INDIVIDUAL (Basic creator) keeps their handle,
FanProfile, Follow records, and support history. No data is lost or hidden on
upgrade. The upgrade only changes `User.account_type` and provisions a `Profile`
row for the creator page.

**v3 Invariant 3: Creator posts are never hard-deleted.**
Post records set `deleted_at` (soft delete). Financial records pattern extended
to content. Deleted posts are hidden from all UI but preserved in the database.

**v3 Invariant 4: Visibility gating is always server-side.**
Whether a fan can see a post (PUBLIC / SUPPORTERS_ONLY / SUBSCRIBERS_ONLY) is
checked on the server during every render. The client never decides visibility.
`SUPPORTERS_ONLY` = at least one completed Donation to this creator.
`SUBSCRIBERS_ONLY` = active Subscription record for this creator.

**v3 Invariant 5: Chat is creator-initiated only.**
Only creator-tier accounts (INDIVIDUAL, PRO, BUSINESS, CONTENT_HOUSE) can call
`POST /api/messages/new`. FAN accounts can reply to existing conversations but
cannot start new ones. Enforced at API level, not just UI.

**v3 Invariant 6: Platform fees are never hardcoded.**
All fee percentages, thresholds, and configurable platform values are read from
the `PlatformSetting` table via `lib/services/platform-settings.ts`. No fee
constant appears anywhere in `lib/services/` or `app/api/`. The only place
default values exist is in `db/seed.ts` and the `getSetting()` fallback parameter.

**v3 Invariant 7: Subscription fees are taken on every renewal.**
Every monthly subscription payment — not just the first — incurs the platform fee
as configured in PlatformSetting. The fee is calculated at payment time using the
current rate from PlatformSetting (not the rate that was active at subscription
creation). Fee changes apply to future renewals only.

**v3 Invariant 8: Post image compression happens client-side.**
Images for creator posts are compressed to a maximum of 1MB before upload to
Vercel Blob. The server does not compress. This protects 3G performance — large
image uploads from mobile devices on slow connections would timeout without
client-side compression.

## Data Model Additions

### New tables in v3

```prisma
// ─── Fan identity ─────────────────────────────────────────────────────────────

model FanProfile {
  id                    Int       @id @default(autoincrement())
  user_id               Int       @unique
  bio                   String?   @db.VarChar(300)
  show_support_history  Boolean   @default(true)
  show_following        Boolean   @default(true)
  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  user                  User      @relation(fields: [user_id], references: [id])
}

model Follow {
  id            Int       @id @default(autoincrement())
  follower_id   Int       // the fan
  creator_id    Int       // the creator being followed
  followed_at   DateTime  @default(now())

  follower      User      @relation("fan_follows", fields: [follower_id], references: [id])
  creator       User      @relation("creator_followers", fields: [creator_id], references: [id])

  @@unique([follower_id, creator_id])
  @@index([follower_id])
  @@index([creator_id])
}

// ─── Feed ──────────────────────────────────────────────────────────────────────

model FeedEvent {
  id            Int           @id @default(autoincrement())
  creator_id    Int           // who generated the event
  event_type    FeedEventType
  resource_id   Int?          // e.g. post_id, fundraiser_id, product_id
  resource_type String?       // "post" | "fundraiser" | "product" | "milestone"
  metadata      Json?         // event-specific data for rendering
  created_at    DateTime      @default(now())

  creator       User          @relation(fields: [creator_id], references: [id])

  @@index([creator_id, created_at])
}

enum FeedEventType {
  POST_PUBLISHED
  FUNDRAISER_LAUNCHED
  FUNDRAISER_MILESTONE  // e.g. hit 50% of goal
  PRODUCT_ADDED
  LINK_ADDED
  DONATION_MILESTONE    // e.g. received 100th donation
}

// ─── Posts ─────────────────────────────────────────────────────────────────────

model Post {
  id            Int             @id @default(autoincrement())
  user_id       Int
  content       String?         @db.Text
  visibility    PostVisibility  @default(PUBLIC)
  is_pinned     Boolean         @default(false)
  like_count    Int             @default(0)   // denormalized
  view_count    Int             @default(0)   // denormalized
  published_at  DateTime        @default(now())
  updated_at    DateTime        @updatedAt
  deleted_at    DateTime?       // soft delete only

  user          User            @relation(fields: [user_id], references: [id])
  images        PostImage[]
  links         PostLink[]
  likes         PostLike[]

  @@index([user_id, published_at])
  @@index([visibility])
  @@index([deleted_at])  // for efficient soft-delete filtering
}

model PostImage {
  id          Int     @id @default(autoincrement())
  post_id     Int
  blob_url    String
  caption     String? @db.VarChar(300)
  position    Int

  post        Post    @relation(fields: [post_id], references: [id], onDelete: Cascade)
  @@index([post_id])
}

model PostLink {
  id              Int     @id @default(autoincrement())
  post_id         Int
  url             String
  smart_card_meta Json?   // same shape as Link.smart_card_meta (v2 Feature 42)

  post            Post    @relation(fields: [post_id], references: [id], onDelete: Cascade)
  @@index([post_id])
}

model PostLike {
  id        Int       @id @default(autoincrement())
  post_id   Int
  user_id   Int
  liked_at  DateTime  @default(now())

  post      Post      @relation(fields: [post_id], references: [id], onDelete: Cascade)
  user      User      @relation(fields: [user_id], references: [id])

  @@unique([post_id, user_id])
  @@index([post_id])
}

enum PostVisibility {
  PUBLIC
  SUPPORTERS_ONLY    // any fan with at least one completed Donation to this creator
  SUBSCRIBERS_ONLY   // fans with an active Subscription to this creator
}

// ─── Subscriptions ─────────────────────────────────────────────────────────────

model Subscription {
  id                  Int                 @id @default(autoincrement())
  fan_user_id         Int
  creator_user_id     Int
  tier_id             Int?                // nullable — basic follow subscription
  amount_ugx          BigInt
  platform_fee_ugx    BigInt
  status              SubscriptionStatus  @default(ACTIVE)
  started_at          DateTime            @default(now())
  next_renewal_at     DateTime
  cancelled_at        DateTime?
  pesapal_txn_id      String?             @unique  // last payment reference

  fan                 User                @relation("fan_subscriptions", fields: [fan_user_id], references: [id])
  creator             User                @relation("creator_subscriptions", fields: [creator_user_id], references: [id])
  tier                MembershipTier?     @relation(fields: [tier_id], references: [id])
  payments            SubscriptionPayment[]

  @@index([fan_user_id])
  @@index([creator_user_id])
  @@index([status])
  @@index([next_renewal_at])
}

model SubscriptionPayment {
  id                Int       @id @default(autoincrement())
  subscription_id   Int
  amount_ugx        BigInt
  platform_fee_ugx  BigInt
  pesapal_txn_id    String    @unique
  paid_at           DateTime  @default(now())
  period_start      DateTime
  period_end        DateTime

  subscription      Subscription @relation(fields: [subscription_id], references: [id])
  @@index([subscription_id])
}

enum SubscriptionStatus {
  ACTIVE
  CANCELLED
  PAST_DUE    // renewal failed, in grace period
  EXPIRED
}

model MembershipTier {
  id            Int       @id @default(autoincrement())
  creator_id    Int
  name          String    // e.g. "Bronze", "Silver", "Gold"
  description   String?   @db.Text
  price_ugx     BigInt
  perks         Json?     // list of perk descriptions
  position      Int       // display order
  is_active     Boolean   @default(true)
  created_at    DateTime  @default(now())

  creator       User      @relation(fields: [creator_id], references: [id])
  subscriptions Subscription[]

  @@index([creator_id])
}

// ─── Chat ──────────────────────────────────────────────────────────────────────

model Conversation {
  id                        Int       @id @default(autoincrement())
  creator_id                Int       // always the creator who initiated
  fan_id                    Int
  created_at                DateTime  @default(now())
  updated_at                DateTime  @updatedAt
  archived_by_creator       Boolean   @default(false)

  creator                   User      @relation("creator_conversations", fields: [creator_id], references: [id])
  fan                       User      @relation("fan_conversations", fields: [fan_id], references: [id])
  messages                  Message[]

  @@unique([creator_id, fan_id])
  @@index([creator_id])
  @@index([fan_id])
}

model Message {
  id                Int       @id @default(autoincrement())
  conversation_id   Int
  sender_id         Int
  content           String    @db.VarChar(2000)
  image_url         String?
  read_at           DateTime?
  created_at        DateTime  @default(now())
  deleted_at        DateTime? // admin-only soft delete

  conversation      Conversation @relation(fields: [conversation_id], references: [id], onDelete: Cascade)
  sender            User         @relation(fields: [sender_id], references: [id])

  @@index([conversation_id, created_at])
}

// ─── Platform settings ─────────────────────────────────────────────────────────

model PlatformSetting {
  id            Int       @id @default(autoincrement())
  key           String    @unique
  value         String    // always stored as string, typed at read time
  description   String    // human-readable for admin UI
  updated_by    Int?      // admin user_id
  updated_at    DateTime  @updatedAt
  created_at    DateTime  @default(now())

  @@index([key])
}

model PlatformSettingAuditLog {
  id          Int       @id @default(autoincrement())
  key         String
  old_value   String
  new_value   String
  changed_by  Int       // admin user_id
  changed_at  DateTime  @default(now())

  @@index([key])
  @@index([changed_by])
}
```

### Changes to existing v1/v2 tables

```prisma
// User — add FAN to AccountType enum and fan_profile relation
enum AccountType {
  FAN            // ← NEW default for all new signups
  INDIVIDUAL     // Basic creator (was the old default)
  PRO
  BUSINESS
  CONTENT_HOUSE
}

model User {
  // existing fields unchanged...
  account_type    AccountType  @default(FAN)   // changed from INDIVIDUAL

  // new relations
  fan_profile     FanProfile?
  follows         Follow[]     @relation("fan_follows")
  followers       Follow[]     @relation("creator_followers")
  posts           Post[]
  post_likes      PostLike[]
  fan_subscriptions   Subscription[] @relation("fan_subscriptions")
  creator_subscriptions Subscription[] @relation("creator_subscriptions")
  membership_tiers MembershipTier[]
  creator_conversations Conversation[] @relation("creator_conversations")
  fan_conversations     Conversation[] @relation("fan_conversations")
}
```

## Service Layer Additions

```
lib/services/platform-settings.ts
  getSetting(key, defaultValue): string
  getSettingAsNumber(key, defaultValue): number
  getFeeRate(key, defaultRate): number   // returns decimal e.g. 0.05 for 5%
  updateSetting(key, value, adminUserId): Promise<void>
  invalidateCache(): void
  [Internal: 5-minute in-memory cache, invalidated on write]

lib/services/fan.ts
  getFanProfile(userId): FanProfile
  updateFanProfile(userId, data): FanProfile
  followCreator(fanId, creatorHandle): Follow
  unfollowCreator(fanId, creatorHandle): void
  getFeed(fanId, cursor): FeedEvent[]
  getSupportHistory(fanId): Donation[]
  claimAnonymousDonations(fanId, phone): void

lib/services/posts.ts
  createPost(userId, data): Post
  updatePost(userId, postId, data): Post
  deletePost(userId, postId): void   // soft delete
  pinPost(userId, postId): void
  likePost(userId, postId): void
  unlikePost(userId, postId): void
  getPostsForProfile(handle, viewerUserId): Post[]  // respects visibility
  getFeedPosts(fanId, cursor): Post[]

lib/services/subscriptions.ts
  createSubscription(fanId, creatorId, tierId, amount): Subscription
  cancelSubscription(fanId, subscriptionId): void
  processRenewal(subscriptionId): SubscriptionPayment  // called by cron
  getSubscriptionFee(subscriberCount): number   // reads from PlatformSetting

lib/services/chat.ts
  getAudienceFilter(creatorId, filter): User[]  // mutuals, top supporters, etc.
  createConversation(creatorId, fanId, message): Conversation
  sendMessage(senderId, conversationId, content): Message
  markRead(userId, conversationId): void
  archiveConversation(creatorId, conversationId): void
```

## Auth and Permission Changes

No changes to Clerk configuration. The permissions layer gains:

- `isCreator(userId)` — checks `account_type !== FAN`
- `isFan(userId)` — checks `account_type === FAN`
- `canViewPost(post, viewerUserId)` — server-side visibility check per Invariant 4
- `canInitiateChat(userId)` — checks `account_type !== FAN` per Invariant 5

## API Surface Summary

### New routes in v3

```
# Fan identity
GET    /api/fan/profile
PATCH  /api/fan/profile
POST   /api/fan/follow/[handle]
DELETE /api/fan/follow/[handle]
GET    /api/fan/following
GET    /api/fan/feed
GET    /api/fan/support-history
POST   /api/fan/claim-donations
GET    /api/fan/subscriptions

# Posts
POST   /api/posts
GET    /api/posts
PATCH  /api/posts/[id]
DELETE /api/posts/[id]
POST   /api/posts/[id]/pin
POST   /api/posts/[id]/like
DELETE /api/posts/[id]/like
POST   /api/posts/upload-image
GET    /api/public/[handle]/posts

# Subscriptions
GET    /api/subscriptions/tiers/[handle]    Fan views creator's tiers
POST   /api/subscriptions                   Fan subscribes
DELETE /api/subscriptions/[id]              Fan cancels
GET    /api/creator/subscriptions           Creator views their subscribers
POST   /api/creator/tiers                   Creator creates a tier
PATCH  /api/creator/tiers/[id]              Creator updates tier
POST   /api/cron/subscription-renewals      Daily cron — process due renewals

# Chat
POST   /api/messages/new                    Creator starts conversation(s)
GET    /api/messages/conversations          Creator inbox
GET    /api/messages/conversations/[id]     Thread
POST   /api/messages/conversations/[id]     Send reply
PATCH  /api/messages/conversations/[id]/archive
GET    /api/messages/audience/[filter]      Creator audience filter
GET    /api/fan/messages                    Fan inbox
POST   /api/fan/messages/[id]               Fan reply
PATCH  /api/fan/messages/[id]/read

# Creator upgrade
GET    /api/creator/tiers-info              Tier comparison data
POST   /api/creator/upgrade                 FAN → creator tier

# Platform settings (admin only)
GET    /api/admin/settings
PATCH  /api/admin/settings/[key]
GET    /api/admin/settings/audit
```

## Open Architectural Questions for v3

- **Pesapal recurring billing**: does Pesapal support automatic monthly re-charge
  on a stored MoMo number? If yes, subscription renewals are automated. If no,
  fans receive a "Your subscription renews in 3 days — tap to pay" push notification
  and complete a new MoMo approval each month. Confirm before Feature 51 starts.
- **Feed fanout strategy**: when a creator with 10,000 followers publishes a post,
  inserting 10,000 FeedEvent rows is expensive. v3 launch volume won't hit this.
  Capture as technical debt: switch to pull-based feed (fan pulls creator's recent
  posts at feed load time) at scale rather than push-based fanout.
- **Chat polling vs WebSocket**: chat uses 30-second polling at launch.
  At high message volume this becomes noisy. Liveblocks (already in
  pending-dependencies.md for Content Houses) is the upgrade path for real-time
  chat too — a single install handles both.
- **Subscription renewal failure**: what happens when a fan's MoMo payment fails
  at renewal? Recommend: 3-day grace period (subscription stays ACTIVE), then
  status → PAST_DUE with daily retry for 7 days, then EXPIRED with a "resubscribe"
  prompt. Confirm before Feature 51 builds the renewal cron.
