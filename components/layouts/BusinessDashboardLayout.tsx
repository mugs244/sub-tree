"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { CalendarDays, Wallet, LogOut, BadgeCheck } from "lucide-react"
import { Logo } from "@/components/brand/Logo"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

// Only Ad Slots and Wallet are wired up so far — Analytics, Posts, Credits,
// Settings, Team and Notifications are still to be built (Home is explicitly
// deferred per the Business Tier spec). Add nav items here as each ships,
// rather than linking to pages that don't exist yet.
const NAV_ITEMS: NavItem[] = [
  { label: "Ad slots", href: "/business/ad-slots", icon: CalendarDays },
  { label: "Wallet", href: "/business/wallet", icon: Wallet },
]

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/")
}

interface BusinessDashboardLayoutProps {
  children: React.ReactNode
  companyName: string
  verified: boolean
}

export function BusinessDashboardLayout({ children, companyName, verified }: BusinessDashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" })
    router.push("/sign-in")
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="hidden md:flex w-56 shrink-0 flex-col fixed inset-y-0 left-0 border-r border-border bg-background z-20">
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Link href="/business/ad-slots">
            <Logo variant="lockup" />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Business navigation">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                  active ? "bg-surface text-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={active ? 2 : 1.5} />
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-border px-3 py-3 space-y-1">
          <button
            onClick={() => void handleSignOut()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground transition-colors duration-150 w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            Sign out
          </button>
          <div className="px-3 py-2 flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground truncate">{companyName}</span>
            <BadgeCheck
              className={["h-3.5 w-3.5 shrink-0", verified ? "text-foreground" : "text-muted-foreground/40"].join(" ")}
              strokeWidth={1.75}
              aria-label={verified ? "Verified" : "Not verified"}
            />
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:ml-56">
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-border bg-background sticky top-0 z-10">
          <Link href="/business/ad-slots">
            <Logo variant="icon" />
          </Link>
          <button
            onClick={() => void handleSignOut()}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground transition-colors duration-150"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5" strokeWidth={1.5} />
          </button>
        </header>

        <main className="flex-1 pb-16 md:pb-0 overflow-auto">{children}</main>
      </div>

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background grid z-20"
        style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, minmax(0, 1fr))` }}
        aria-label="Mobile business navigation"
      >
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={["flex flex-col items-center justify-center gap-1 transition-colors duration-150", active ? "text-foreground" : "text-muted-foreground"].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
