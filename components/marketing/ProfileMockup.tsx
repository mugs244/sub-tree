// Illustrative mini profile page, used on the landing page and the auth
// screens' brand panel.
export function ProfileMockup() {
  return (
    <div className="w-full max-w-[260px] rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
      <div className="h-2 bg-surface border-b border-border" />
      <div className="px-5 py-6 space-y-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-lg font-semibold">
            A
          </div>
          <div>
            <p className="text-sm font-semibold">Amara Naledi</p>
            <p className="text-[10px] text-muted-foreground font-mono">@amara</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Content creator · Kampala</p>
          </div>
        </div>
        <div className="space-y-2">
          {["YouTube Channel", "Instagram", "WhatsApp"].map((label) => (
            <div
              key={label}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-center"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="w-full rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-medium text-center">
          Gift Amara 💛
        </div>
        <p className="text-center text-[9px] text-muted-foreground">
          Powered by Sub-tree
        </p>
      </div>
    </div>
  )
}

