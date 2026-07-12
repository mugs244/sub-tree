// Hardcoded neutral colors, not the theme-driven bg-surface/border-border/
// text-muted-foreground classes — this is platform-level messaging shown on
// public profile pages, and must never inherit a creator's custom theme CSS
// variables (which override those exact tokens). See docs/pending.md → Gift
// Me for why this is a placeholder and not the real catalog/payment flow.
export function GiftMeSection({ displayName }: { displayName: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 text-center p-6 space-y-2">
      <p className="text-sm font-medium text-gray-900">Gift me</p>
      <p className="text-xs text-gray-500 leading-relaxed">
        Soon you&apos;ll be able to gift {displayName} WiFi, mobile data, airtime, and TV subscriptions directly.
      </p>
    </div>
  )
}
