// Describes where a sign-in (or sign-in attempt) came from, for security
// emails: "Chrome on Android · Kampala, Uganda · 1 Oct 2026, 17:40".
// Location comes from Vercel's IP geolocation headers, so it's approximate
// and absent in local development.

export interface LoginContext {
  device: string
  location: string | null
  time: string
}

function browserOf(ua: string): string | null {
  if (/Edg\//.test(ua)) return "Edge"
  if (/OPR\/|Opera/.test(ua)) return "Opera"
  if (/SamsungBrowser\//.test(ua)) return "Samsung Internet"
  if (/Firefox\//.test(ua)) return "Firefox"
  if (/Chrome\//.test(ua)) return "Chrome"
  if (/Safari\//.test(ua) && /Version\//.test(ua)) return "Safari"
  return null
}

function systemOf(ua: string): string | null {
  if (/iPhone/.test(ua)) return "iPhone"
  if (/iPad/.test(ua)) return "iPad"
  if (/Android/.test(ua)) return "Android"
  if (/Windows/.test(ua)) return "Windows"
  if (/Mac OS X|Macintosh/.test(ua)) return "Mac"
  if (/Linux/.test(ua)) return "Linux"
  return null
}

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code
  } catch {
    return code
  }
}

export function getLoginContext(headers: Headers): LoginContext {
  const ua = headers.get("user-agent") ?? ""
  const browser = browserOf(ua)
  const system = systemOf(ua)
  const device = browser && system ? `${browser} on ${system}` : browser ?? system ?? "Unknown device"

  const rawCity = headers.get("x-vercel-ip-city")
  const country = headers.get("x-vercel-ip-country")
  let city: string | null = null
  try { city = rawCity ? decodeURIComponent(rawCity) : null } catch { city = rawCity }
  const location = [city, country ? countryName(country) : null].filter(Boolean).join(", ") || null

  const time = new Date().toLocaleString("en-UG", { timeZone: "Africa/Kampala", dateStyle: "medium", timeStyle: "short" }) + " (Kampala time)"

  return { device, location, time }
}
