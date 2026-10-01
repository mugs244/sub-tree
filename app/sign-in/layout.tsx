import type { Metadata } from "next"

// The page itself is a client component, so its title lives here.
export const metadata: Metadata = {
  title: "Sign in — Sub-tree",
  openGraph: { title: "Sign in — Sub-tree", url: "/sign-in", siteName: "Sub-tree", type: "website", images: "/opengraph-image" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
