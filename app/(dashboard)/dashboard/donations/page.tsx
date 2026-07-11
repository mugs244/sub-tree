import { getSession } from "@/lib/auth/session"
import { prisma } from "@/lib/db"
import { Heart } from "lucide-react"
import { DonationExportButton } from "@/components/DonationExportButton"

export default async function DonationsPage() {
  const session = await getSession()
  const userId = session!.userId

  const donations = await prisma.donation.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: 50,
    select: {
      id: true,
      donor_name: true,
      donor_phone: true,
      amount: true,
      currency: true,
      status: true,
      provider: true,
      created_at: true,
    },
  })

  if (donations.length === 0) {
    return (
      <div className="p-6 md:p-8 max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight mb-6">Donations</h1>
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
          <Heart className="h-12 w-12 text-muted-foreground/40" strokeWidth={1} />
          <p className="text-sm font-medium">No donations yet</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Once supporters donate via your public page, they'll appear here.
            Mobile money integration coming soon.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Donations</h1>
        <DonationExportButton />
      </div>
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Donor</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {donations.map((d) => (
              <tr key={d.id} className="bg-background hover:bg-surface transition-colors duration-100">
                <td className="px-4 py-3">
                  <p className="font-medium">{d.donor_name ?? "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{d.donor_phone ?? "Card payment"}</p>
                </td>
                <td className="px-4 py-3 font-mono">
                  {d.currency} {d.amount.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">
                  {new Date(d.created_at).toLocaleDateString("en-UG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    PENDING:    { label: "Pending",    className: "bg-warning-bg text-warning" },
    PROCESSING: { label: "Processing", className: "bg-warning-bg text-warning" },
    COMPLETED:  { label: "Completed",  className: "bg-success-bg text-success" },
    FAILED:     { label: "Failed",     className: "bg-error-bg text-error" },
    REVERSED:   { label: "Reversed",   className: "bg-surface text-muted-foreground" },
  }
  const { label, className } = map[status] ?? { label: status, className: "bg-surface text-muted-foreground" }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
