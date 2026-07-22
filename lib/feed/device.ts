import { randomUUID } from "crypto"
import type { NextResponse } from "next/server"

// Ad-tre keys frequency capping on a stable per-device token. The feed is
// public and largely anonymous, so we mint an opaque first-party cookie on
// first contact rather than relying on a logged-in user id. Not security-
// sensitive — it only groups a viewer's ad exposure — so it isn't httpOnly-
// gated for reads the client may want, but it is SameSite=Lax and long-lived.

export const DEVICE_COOKIE = "st_device"
const ONE_YEAR_SEC = 365 * 24 * 60 * 60

// Returns the device id from the request cookie, or a freshly minted one.
// `minted` signals the caller to set it on the response.
export function readOrMintDeviceId(req: Request): { deviceId: string; minted: boolean } {
  const cookie = req.headers.get("cookie") ?? ""
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${DEVICE_COOKIE}=([^;]+)`))
  if (match?.[1]) return { deviceId: decodeURIComponent(match[1]), minted: false }
  return { deviceId: randomUUID(), minted: true }
}

export function setDeviceCookie<T>(res: NextResponse<T>, deviceId: string): NextResponse<T> {
  res.cookies.set(DEVICE_COOKIE, deviceId, {
    path: "/",
    maxAge: ONE_YEAR_SEC,
    sameSite: "lax",
  })
  return res
}
