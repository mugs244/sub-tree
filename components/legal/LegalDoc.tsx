export function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-warning-bg text-warning px-1 rounded font-medium">
      {children}
    </span>
  )
}

export function LegalPageHeader({
  title,
  effectiveDate,
  lastUpdated,
}: {
  title: string
  effectiveDate: string
  lastUpdated: string
}) {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">
        <strong className="font-medium text-foreground">Effective date:</strong> {effectiveDate}
        <br />
        <strong className="font-medium text-foreground">Last updated:</strong> {lastUpdated}
      </p>
    </div>
  )
}

export function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">
        {n}. {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

export function Clause({ n, lead, children }: { n: string; lead?: string; children: React.ReactNode }) {
  return (
    <p>
      <span className="text-muted-foreground text-sm align-top mr-1.5">{n}.</span>
      {lead && <strong>{lead} </strong>}
      {children}
    </p>
  )
}
