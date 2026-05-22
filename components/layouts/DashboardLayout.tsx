"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignOutButton } from "@clerk/nextjs"
import { Home, Link2, Heart, Palette, Settings, ExternalLink, LogOut } from "lucide-react"
import { Logo } from "@/components/brand/Logo"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const sidebarNav: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Links", href: "/dashboard/links", icon: Link2 },
  { label: "Donations", href: "/dashboard/donations", icon: Heart },
  { label: "Appearance", href: "/dashboard/appearance", icon: Palette },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

const mobileNav: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Links", href: "/dashboard/links", icon: Link2 },
  { label: "Donations", href: "/dashboard/donations", icon: Heart },
  { label: "Appearance", href: "/dashboard/appearance", icon: Palette },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard"
  return pathname === href || pathname.startsWith(href + "/")
}

interface DashboardLayoutProps {
  children: React.ReactNode
  username: string
}

export function DashboardLayout({ children, username }: DashboardLayoutProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex bg-background">
      {/* ── Desktop sidebar ───────────────────────────────── */}
      <aside className="hidden md:flex w-56 shrink-0 flex-col fixed inset-y-0 left-0 border-r border-border bg-background z-20">
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Link href="/dashboard">
            <Logo variant="lockup" />
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Main navigation">
          {sidebarNav.map(({ label, href, icon: Icon }) => {
            const active = isActive(pathname, href)
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-surface text-foreground"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground",
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
          <Link
            href={`/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground transition-colors duration-150"
          >
            <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={1.5} />
            View profile
          </Link>
          <SignOutButton>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-surface hover:text-foreground transition-colors duration-150 w-full">
              <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              Sign out
            </button>
          </SignOutButton>
          <div className="px-3 py-2">
            <span className="text-sm font-medium text-foreground truncate">@{username}</span>
          </div>
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:ml-56">
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b border-border bg-background sticky top-0 z-10">
          <Link href="/dashboard">
            <Logo variant="icon" />
          </Link>
          <SignOutButton>
            <button
              className="flex items-center justify-center h-9 w-9 rounded-lg text-muted-foreground hover:bg-surface hover:text-foreground transition-colors duration-150"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </SignOutButton>
        </header>

        <main className="flex-1 pb-16 md:pb-0 overflow-auto">{children}</main>
      </div>

      {/* ── Mobile bottom tab bar ─────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-border bg-background grid grid-cols-5 z-20"
        aria-label="Mobile navigation"
      >
        {mobileNav.map(({ label, href, icon: Icon }) => {
          const active = isActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex flex-col items-center justify-center gap-1 transition-colors duration-150",
                active ? "text-foreground" : "text-muted-foreground",
              ].join(" ")}
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
