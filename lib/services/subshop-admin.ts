import { subShopAdminUrl } from "@/lib/services/admin"

// Creates and removes Sub-shop (Mercur) admin logins when a super admin turns
// "Can switch to Sub-shop admin" on or off on Admin → Team. Talks to the
// Mercur admin API with a secret API key created in the Sub-shop admin panel
// (Settings → Secret API keys).
//
//   SUBSHOP_API_URL        e.g. https://api.shop.sub-tree.com (local: http://localhost:9000)
//   SUBSHOP_ADMIN_API_KEY  sk_… secret key
//
// Without them the Sub-tree permission still changes; the super admin then
// creates the Sub-shop login by hand.

export class SubShopAdminError extends Error {}

function api(): { base: string; auth: string } | null {
  const base = process.env.SUBSHOP_API_URL?.replace(/\/+$/, "")
  const key = process.env.SUBSHOP_ADMIN_API_KEY
  if (!base || !key) return null
  return { base, auth: `Basic ${Buffer.from(`${key}:`).toString("base64")}` }
}

export function subShopAdminSyncConfigured(): boolean {
  return api() !== null
}

async function call(path: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
  const a = api()
  if (!a) throw new SubShopAdminError("Sub-shop admin sync isn't configured")
  const res = await fetch(`${a.base}${path}`, {
    ...init,
    headers: { Authorization: a.auth, "Content-Type": "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(15_000),
  })
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) throw new SubShopAdminError(`Sub-shop said ${res.status}: ${String(body.message ?? "request failed")}`)
  return body
}

// Invites the email to the Sub-shop admin panel (or reuses a pending invite)
// and returns the link they open to set their password. Null if they already
// have a Sub-shop admin login.
export async function inviteSubShopAdmin(email: string): Promise<{ inviteUrl: string } | null> {
  const users = (await call(`/admin/users?q=${encodeURIComponent(email)}`)).users as { email: string }[] | undefined
  if (users?.some((u) => u.email.toLowerCase() === email.toLowerCase())) return null

  const invites = (await call(`/admin/invites?q=${encodeURIComponent(email)}`)).invites as { email: string; token: string; accepted: boolean }[] | undefined
  const pending = invites?.find((i) => i.email.toLowerCase() === email.toLowerCase() && !i.accepted)
  const token = pending?.token ?? ((await call("/admin/invites", { method: "POST", body: JSON.stringify({ email }) })).invite as { token: string }).token
  return { inviteUrl: `${subShopAdminUrl().replace(/\/+$/, "")}/invite?token=${encodeURIComponent(token)}` }
}

// Removes the email's Sub-shop admin login and any pending invite.
export async function removeSubShopAdmin(email: string): Promise<void> {
  const same = (e: string) => e.toLowerCase() === email.toLowerCase()
  const users = (await call(`/admin/users?q=${encodeURIComponent(email)}`)).users as { id: string; email: string }[] | undefined
  for (const u of users?.filter((u) => same(u.email)) ?? []) await call(`/admin/users/${u.id}`, { method: "DELETE" })
  const invites = (await call(`/admin/invites?q=${encodeURIComponent(email)}`)).invites as { id: string; email: string; accepted: boolean }[] | undefined
  for (const i of invites?.filter((i) => same(i.email) && !i.accepted) ?? []) await call(`/admin/invites/${i.id}`, { method: "DELETE" })
}
