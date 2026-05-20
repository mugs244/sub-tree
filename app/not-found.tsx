import Link from "next/link"
import { Logo } from "@/components/brand/Logo"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <Link href="/" className="mb-10">
        <Logo variant="lockup" />
      </Link>

      <p className="text-7xl font-semibold tracking-tight text-foreground mb-4">404</p>
      <h1 className="text-xl font-semibold mb-2">Page not found</h1>
      <p className="text-sm text-muted-foreground max-w-xs mb-8">
        This page doesn&apos;t exist or the creator may have removed their account.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-accent-dark transition-colors"
      >
        Go home
      </Link>
    </div>
  )
}
