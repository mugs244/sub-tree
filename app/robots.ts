import type { MetadataRoute } from "next"

// Lets search engines crawl public pages (landing, policies, creator pages)
// and keeps them out of private areas.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/dashboard", "/onboarding", "/fan", "/pay/", "/order-success", "/dev", "/auth", "/verify-email", "/forgot-password", "/donate/complete"],
    },
    sitemap: "https://sub-tree.com/sitemap.xml",
    host: "https://sub-tree.com",
  }
}
