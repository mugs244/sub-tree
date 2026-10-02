import type { MetadataRoute } from "next"
import { prisma } from "@/lib/db"

const SITE = "https://sub-tree.com"

// Rebuilt at most hourly so new creator pages show up for Google.
export const revalidate = 3600

// The landing page, the sign-up pages, the policies and every live creator
// page. Dashboards, admin, checkout and API routes stay out (see robots.ts).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const pages: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/sign-up`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/sign-in`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    ...["terms", "refunds", "cookies", "acceptable-use", "copyright"].map((p) => ({
      url: `${SITE}/${p}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.3,
    })),
  ]

  const creators = await prisma.profile.findMany({
    where: { user: { deleted_at: null, username: { not: null }, account_type: { not: "FAN" } } },
    select: { updated_at: true, user: { select: { username: true } } },
    orderBy: { updated_at: "desc" },
    take: 45_000, // one sitemap file holds up to 50,000 URLs
  })

  return [
    ...pages,
    ...creators.map((c) => ({
      url: `${SITE}/${encodeURIComponent(c.user.username!)}`,
      lastModified: c.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ]
}
