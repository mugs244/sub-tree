Admin features spec
===================

This document maps user-portal features to the admin interfaces needed to manage them.

Overview
- Purpose: provide a concise admin-side feature list and pages to manage users, subscriptions/tiers, affiliates, orders/payments, and platform settings.

Sections
- Users
  - List users (search by email/username)
  - View user details (profile, links, subscriptions, payments)
  - Manage roles (promote/demote admin/mod)
  - Suspend/ban/reactivate users

- Membership Tiers
  - List creator tiers
  - Create/update/delete tiers (price, perks JSON)
  - View subscription counts / revenue per tier

- Affiliates
  - List affiliate applications and requests
  - Approve/reject requests
  - Manage affiliate grants and commissions
  - View affiliate earnings and payouts

- Content House Applications
  - Review creator applications for content house access
  - Approve/reject applications
  - Assign content house roles and permissions
  - Monitor active content house creators

- Trials & Free Access
  - Manage trial timers and free trial settings
  - View users on trial and trial expiration dates
  - Extend or revoke trial access
  - Configure trial duration and eligibility

- Analytics / User Geography
  - Show a world map of users by country
  - Aggregate users by country and platform role
  - Track trial and subscription counts by region
  - Drill into country-level user lists
  - Track last active time for users

- Orders & Payouts
  - List orders, filter by status and affiliate attribution
  - Manually create payout records
  - Trigger payout processing (cron or manual)

- Platform Settings
  - Payment provider keys (dev only)
  - Feature toggles (disable signup, bypass payments)

Initial scaffold
- `app/admin/dashboard/page.tsx` – overview with links to admin sections
- `app/admin/users/page.tsx` – users list view
- `app/admin/affiliates/page.tsx` – affiliates dashboard
- `app/admin/tiers/page.tsx` – membership tiers management
- `app/admin/analytics/page.tsx` – user geography / analytics dashboard
- `components/AdminUsersTable.tsx` – client-side table fetching `/api/admin/users`
- `components/AdminAffiliatesPanel.tsx` – client-side affiliate panel
- `components/AdminGeoMap.tsx` – placeholder map component for geography analytics

Notes
- API endpoints under `/api/admin/*` should require admin auth (Clerk or internal check). If not present yet, create server handlers that use `auth()` and check a role claim.
- Start with read-only UI if APIs don't exist; add action endpoints incrementally.
