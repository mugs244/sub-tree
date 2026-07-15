// Vercel's edge network adds this header on every production request —
// absent in local dev, absent behind other hosts. "XX" is Vercel's
// placeholder for "couldn't determine" and should be treated as unset.
export function getCountryFromHeaders(headers: Headers): string | null {
  const country = headers.get("x-vercel-ip-country")
  return country && country !== "XX" ? country : null
}

// x-forwarded-for can carry a "client, proxy1, proxy2" chain — the client's
// own address is always the first entry. Absent in local dev.
export function getIpFromHeaders(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || null
  return headers.get("x-real-ip")
}
