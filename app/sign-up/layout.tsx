import type { Metadata } from "next"

// The page itself is a client component, so its title lives here.
export const metadata: Metadata = {
  title: "Create your account — Sub-tree",
  openGraph: { title: "Create your account — Sub-tree", url: "/sign-up", siteName: "Sub-tree", type: "website", images: "/opengraph-image" },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
