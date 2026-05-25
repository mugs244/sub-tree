# Feature 63 — Platform Settings & Admin Fee Configuration

## Status
**Greenlit** — build before any v3 monetization features and backfill into v1/v2.

## Date
2026-05-25

## Context Links
- `docs/ARCHITECTURE.md` — admin role (Clerk custom claim)
- `docs/STANDARDS.md` — no hardcoded fee constants (v3 Invariant 6)
- `docs/features/12-reserved-username-admin.md` — existing admin pattern

## Why
Fee rates, thresholds, and platform-wide settings should never be hardcoded.
Admin can adjust without a code deploy. Enables A/B testing fee rates, responding
to competitive pressure, and correcting mistakes instantly.

This feature is the prerequisite for all v3 monetization (subscriptions, shop fees,
fundraiser fees) AND is a backfill task for v1/v2 (replace hardcoded fee constants
in `lib/services/donation.ts` with `getSetting()` calls).

## Default Settings to Seed

| Key | Default value | Description |
|---|---|---|
| fee_donation_free | 0.05 | Donation platform fee — Free tier |
| fee_donation_pro | 0.03 | Donation platform fee — Pro tier |
| fee_donation_business | 0.03 | Donation platform fee — Business tier |
| fee_donation_content_house | 0.03 | Donation platform fee — Content House |
| fee_shop_business | 0.08 | Shop sale platform fee — Business tier |
| fee_shop_content_house | 0.08 | Shop sale platform fee — Content House |
| fee_fundraiser_free | 0.05 | Fundraiser platform fee — Free tier |
| fee_fundraiser_pro | 0.03 | Fundraiser platform fee — Pro+ |
| fee_subscription_default | 0.05 | Subscription fee — default flat rate |
| fee_subscription_progressive_enabled | false | Toggle progressive subscription fees |
| fee_subscription_tier_1_threshold | 100 | Subscribers before lower rate kicks in |
| fee_subscription_tier_1_rate | 0.07 | Fee rate below threshold |
| fee_subscription_tier_2_rate | 0.04 | Fee rate above threshold |
| affiliate_min_payout_ugx | 5000 | Minimum affiliate payout amount (UGX) |
| escrow_default_release_days | 7 | Default escrow auto-release days |
| max_dispute_window_days | 14 | Max days buyer can raise dispute |
| platform_maintenance_mode | false | 503 all payment endpoints if true |
| chat_max_conversations_per_day | 50 | Creator DM rate limit |
| max_post_images | 4 | Max images per creator post |
| digital_download_max_count | 3 | Max downloads per digital purchase |
| digital_download_expiry_hours | 48 | Hours before download link expires |

## Service Layer

```typescript
// lib/services/platform-settings.ts

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: Map<string, { value: string; expiresAt: number }> = new Map();

export async function getSetting(key: string, defaultValue: string): Promise<string> {
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const setting = await prisma.platformSetting.findUnique({ where: { key } });
  const value = setting?.value ?? defaultValue;
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  return value;
}

export async function getSettingAsNumber(key: string, defaultValue: number): Promise<number> {
  const raw = await getSetting(key, String(defaultValue));
  const parsed = parseFloat(raw);
  return isNaN(parsed) ? defaultValue : parsed;
}

export async function getFeeRate(key: string, defaultRate: number): Promise<number> {
  return getSettingAsNumber(key, defaultRate);
}

export async function updateSetting(
  key: string, value: string, adminUserId: number
): Promise<void> {
  const current = await prisma.platformSetting.findUnique({ where: { key } });

  await prisma.$transaction([
    prisma.platformSetting.upsert({
      where: { key },
      update: { value, updated_by: adminUserId },
      create: { key, value, description: "", updated_by: adminUserId },
    }),
    prisma.platformSettingAuditLog.create({
      data: {
        key,
        old_value: current?.value ?? "(not set)",
        new_value: value,
        changed_by: adminUserId,
      },
    }),
  ]);

  // Invalidate cache for this key
  cache.delete(key);
}
```

## Example usage in donation service

```typescript
// lib/services/donation.ts — BEFORE (hardcoded)
const FEE_RATE = 0.05;
const creatorAmount = amount * (1 - FEE_RATE);

// lib/services/donation.ts — AFTER (configurable)
const feeKey = user.tier === "FREE" ? "fee_donation_free" : "fee_donation_pro";
const feeRate = await getFeeRate(feeKey, 0.05);
const creatorAmount = BigInt(Math.floor(Number(amount) * (1 - feeRate)));
```

## Admin UI

`app/admin/settings/page.tsx`:
- Table: key, current value, description, last changed by, last changed at
- Inline edit: click value → input → Save
- Confirmation modal before saving any fee change:
  "You are changing fee_donation_free from 5% to 4%.
   This affects all future donations. Confirm?"
- Audit log tab: every change with actor, old value, new value, timestamp

## Validation Rules
- Fee values: must parse as a float between 0.0 and 0.30 (0% to 30% max)
- Boolean values: "true" or "false" only
- Integer values: must parse as a non-negative integer
- All validation enforced server-side before the upsert

## Data Model
See `docs/v3/V3-ARCHITECTURE.md` — PlatformSetting, PlatformSettingAuditLog.

## Backfill Task
When this feature ships, also:
1. Replace hardcoded 0.05/0.03 fee constants in `lib/services/donation.ts`
   with `getFeeRate()` calls
2. Replace hardcoded escrow release days in v2 shop code with `getSetting()`
3. Replace hardcoded digital download limits and expiry with `getSetting()`
4. Replace chat rate limit constant in Feature 62 with `getSetting()`
Commit this backfill as part of the same PR as Feature 63.

## Success Criteria
1. Admin can change fee_donation_free from 5% to 4% in UI — next donation
   calculates at 4%
2. Change is logged with admin's name, old value, new value, timestamp
3. Existing completed donations are unaffected
4. Setting fee above 30% or below 0% is rejected at API level
5. Settings are cached — DB not hit on every payment calculation
6. platform_maintenance_mode = "true" returns 503 on all payment endpoints

## New Invariants
v3 Invariant 6: Platform fees are never hardcoded (see V3-ARCHITECTURE.md)
v3 Invariant 7: Subscription fees taken on every renewal at current rate
