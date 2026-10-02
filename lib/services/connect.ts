import { prisma } from "@/lib/db"
import type { ConnectProvider } from "@/lib/platform-catalog"

// "Connect" in Add link: the creator signs in to a platform (OAuth), we read
// who they are there, and save their profile as a link tied to that account.
// We only ask for basic profile access and never store the access token —
// it's used once to read the profile, then dropped.
//
// Each provider needs its own developer app; the redirect URL to register
// is https://sub-tree.com/api/connect/<provider>/callback. Until a
// provider's keys are set, its Connect button is hidden and creators add
// that platform by typing instead.
//
//   Spotify  SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET
//   YouTube  GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET (YouTube Data API enabled)
//   TikTok   TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET (Login Kit, needs TikTok's review)
//   Twitch   TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET
//   GitHub   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET

export class ConnectError extends Error {
  constructor(public readonly code: "NOT_CONFIGURED" | "DENIED" | "FAILED" | "NO_CHANNEL", message: string) {
    super(message)
    this.name = "ConnectError"
  }
}

interface Profile {
  accountId: string
  url: string
  label: string
}

interface ProviderConfig {
  name: string
  envId: string
  envSecret: string
  authorizeUrl: string
  scope: string
  extraAuthParams?: Record<string, string>
  /** TikTok calls the client id "client_key". */
  clientIdParam?: string
  exchange: (code: string, redirectUri: string, id: string, secret: string) => Promise<string>
  profile: (token: string, clientId: string) => Promise<Profile>
}

async function json(res: Response, what: string): Promise<Record<string, unknown>> {
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
  if (!res.ok) {
    console.error(`Connect: ${what} failed`, res.status, body)
    throw new ConnectError("FAILED", `Couldn't reach the platform (${what})`)
  }
  return body
}

const form = (data: Record<string, string>) => new URLSearchParams(data)

const PROVIDERS: Record<ConnectProvider, ProviderConfig> = {
  spotify: {
    name: "Spotify",
    envId: "SPOTIFY_CLIENT_ID",
    envSecret: "SPOTIFY_CLIENT_SECRET",
    authorizeUrl: "https://accounts.spotify.com/authorize",
    scope: "",
    async exchange(code, redirectUri, id, secret) {
      const res = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}` },
        body: form({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
      })
      return String((await json(res, "token")).access_token ?? "")
    },
    async profile(token) {
      const me = await json(await fetch("https://api.spotify.com/v1/me", { headers: { Authorization: `Bearer ${token}` } }), "profile")
      const urls = me.external_urls as { spotify?: string } | undefined
      return { accountId: String(me.id), url: urls?.spotify ?? `https://open.spotify.com/user/${me.id}`, label: "Spotify" }
    },
  },
  youtube: {
    name: "YouTube",
    envId: "GOOGLE_OAUTH_CLIENT_ID",
    envSecret: "GOOGLE_OAUTH_CLIENT_SECRET",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    scope: "https://www.googleapis.com/auth/youtube.readonly",
    extraAuthParams: { prompt: "select_account" },
    async exchange(code, redirectUri, id, secret) {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form({ grant_type: "authorization_code", code, redirect_uri: redirectUri, client_id: id, client_secret: secret }),
      })
      return String((await json(res, "token")).access_token ?? "")
    },
    async profile(token) {
      const body = await json(await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { Authorization: `Bearer ${token}` } }), "channel")
      const ch = (body.items as { id: string; snippet?: { customUrl?: string } }[] | undefined)?.[0]
      if (!ch) throw new ConnectError("NO_CHANNEL", "That Google account doesn't have a YouTube channel")
      const handle = ch.snippet?.customUrl
      return { accountId: ch.id, url: handle ? `https://www.youtube.com/${handle.startsWith("@") ? handle : `@${handle}`}` : `https://www.youtube.com/channel/${ch.id}`, label: "YouTube" }
    },
  },
  tiktok: {
    name: "TikTok",
    envId: "TIKTOK_CLIENT_KEY",
    envSecret: "TIKTOK_CLIENT_SECRET",
    authorizeUrl: "https://www.tiktok.com/v2/auth/authorize/",
    scope: "user.info.basic,user.info.profile",
    clientIdParam: "client_key",
    async exchange(code, redirectUri, id, secret) {
      const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form({ client_key: id, client_secret: secret, code, grant_type: "authorization_code", redirect_uri: redirectUri }),
      })
      return String((await json(res, "token")).access_token ?? "")
    },
    async profile(token) {
      const body = await json(
        await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,username,profile_deep_link", { headers: { Authorization: `Bearer ${token}` } }),
        "profile",
      )
      const user = (body.data as { user?: { open_id?: string; username?: string; profile_deep_link?: string } } | undefined)?.user
      if (!user?.open_id) throw new ConnectError("FAILED", "TikTok didn't return your profile")
      return { accountId: user.open_id, url: user.username ? `https://www.tiktok.com/@${user.username}` : user.profile_deep_link ?? "https://www.tiktok.com", label: "TikTok" }
    },
  },
  twitch: {
    name: "Twitch",
    envId: "TWITCH_CLIENT_ID",
    envSecret: "TWITCH_CLIENT_SECRET",
    authorizeUrl: "https://id.twitch.tv/oauth2/authorize",
    scope: "",
    async exchange(code, redirectUri, id, secret) {
      const res = await fetch("https://id.twitch.tv/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form({ client_id: id, client_secret: secret, code, grant_type: "authorization_code", redirect_uri: redirectUri }),
      })
      return String((await json(res, "token")).access_token ?? "")
    },
    async profile(token, clientId) {
      const body = await json(await fetch("https://api.twitch.tv/helix/users", { headers: { Authorization: `Bearer ${token}`, "Client-Id": clientId } }), "profile")
      const u = (body.data as { id: string; login: string }[] | undefined)?.[0]
      if (!u) throw new ConnectError("FAILED", "Twitch didn't return your profile")
      return { accountId: u.id, url: `https://www.twitch.tv/${u.login}`, label: "Twitch" }
    },
  },
  github: {
    name: "GitHub",
    envId: "GITHUB_CLIENT_ID",
    envSecret: "GITHUB_CLIENT_SECRET",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    scope: "",
    async exchange(code, redirectUri, id, secret) {
      const res = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
        body: form({ client_id: id, client_secret: secret, code, redirect_uri: redirectUri }),
      })
      return String((await json(res, "token")).access_token ?? "")
    },
    async profile(token) {
      const u = await json(await fetch("https://api.github.com/user", { headers: { Authorization: `Bearer ${token}`, "User-Agent": "Sub-tree" } }), "profile")
      return { accountId: String(u.id), url: String(u.html_url), label: "GitHub" }
    },
  },
}

export function isConnectProvider(v: string): v is ConnectProvider {
  return v in PROVIDERS
}

export function availableConnectProviders(): ConnectProvider[] {
  return (Object.keys(PROVIDERS) as ConnectProvider[]).filter((p) => process.env[PROVIDERS[p].envId] && process.env[PROVIDERS[p].envSecret])
}

function keys(p: ConnectProvider) {
  const c = PROVIDERS[p]
  const id = process.env[c.envId]
  const secret = process.env[c.envSecret]
  if (!id || !secret) throw new ConnectError("NOT_CONFIGURED", `${c.name} connect isn't set up yet`)
  return { c, id, secret }
}

export function authorizeUrl(p: ConnectProvider, redirectUri: string, state: string): string {
  const { c, id } = keys(p)
  const params = new URLSearchParams({
    [c.clientIdParam ?? "client_id"]: id,
    response_type: "code",
    redirect_uri: redirectUri,
    state,
    ...(c.scope ? { scope: c.scope } : {}),
    ...c.extraAuthParams,
  })
  return `${c.authorizeUrl}?${params}`
}

// Exchanges the code, reads the profile and saves (or refreshes) the link.
// Connecting the same account again updates its existing link instead of
// adding a duplicate. Returns the link id.
export async function completeConnect(userId: number, p: ConnectProvider, code: string, redirectUri: string): Promise<number> {
  const { c, id, secret } = keys(p)
  const token = await c.exchange(code, redirectUri, id, secret)
  if (!token) throw new ConnectError("FAILED", `${c.name} didn't confirm the sign-in`)
  const profile = await c.profile(token, id)

  const existing = await prisma.link.findFirst({
    where: { user_id: userId, connected_provider: p, connected_account_id: profile.accountId },
    select: { id: true },
  })
  if (existing) {
    await prisma.link.update({ where: { id: existing.id }, data: { connected_at: new Date(), is_enabled: true } })
    return existing.id
  }

  const max = await prisma.link.aggregate({ where: { user_id: userId }, _max: { position: true } })
  const link = await prisma.link.create({
    data: {
      user_id: userId,
      url: profile.url,
      label: profile.label,
      position: (max._max.position ?? -1) + 1,
      connected_provider: p,
      connected_account_id: profile.accountId,
      connected_at: new Date(),
    },
    select: { id: true },
  })
  return link.id
}
