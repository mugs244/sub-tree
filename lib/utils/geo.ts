// Vercel's edge network adds this header on every production request —
// absent in local dev, absent behind other hosts. "XX" is Vercel's
// placeholder for "couldn't determine" and should be treated as unset.
export function getCountryFromHeaders(headers: Headers): string | null {
  const country = headers.get("x-vercel-ip-country")
  return country && country !== "XX" ? country : null
}
