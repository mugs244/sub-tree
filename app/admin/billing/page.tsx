import Link from "next/link"
import { prisma } from "@/lib/db"
import { getRevenueSummary } from "@/lib/services/admin-console"
import { invoiceNumber, PLANS, type Plan } from "@/lib/services/billing"
import { AdminAction } from "@/components/admin/AdminAction"

export const metadata = { title: "Billing — Admin" }
type Props = { searchParams: Promise<{ status?: string }> }

const ugx = (n: number) => `UGX ${Math.round(n).toLocaleString("en-UG")}`
const day = (d: Date | null) => (d ? d.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" }) : "—")
const FILTERS = [
  { value: "open", label: "Open" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
  { value: "all", label: "All" },
]

// Sub-pay from the admin side: subscriptions, invoices and revenue.
export default async function AdminBillingPage({ searchParams }: Props) {
  const status = (await searchParams).status ?? "open"
  const where =
    status === "open" ? { status: "OPEN" }
    : status === "overdue" ? { status: "OPEN", due_at: { lt: new Date() } }
    : status === "paid" ? { status: "PAID" }
    : {}

  const [revenue, invoices, openTotals, subs] = await Promise.all([
    getRevenueSummary(),
    prisma.invoice.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 100,
      select: {
        id: true, plan: true, amount: true, status: true, due_at: true, paid_at: true, payment_method: true,
        user: { select: { id: true, username: true, email: true } },
      },
    }),
    prisma.invoice.aggregate({ where: { status: "OPEN" }, _count: { id: true }, _sum: { amount: true } }),
    prisma.verificationSubscription.groupBy({ by: ["plan", "status"], _count: { id: true } }),
  ])
  const count = (plan: string) => subs.filter((s) => s.plan === plan && s.status === "ACTIVE").reduce((n, s) => n + s._count.id, 0)

  return (
    <div className="max-w-5xl space-y-6 px-4 py-5 md:p-8">
      <div>
        <p className="mb-1 font-mono text-xs text-muted-foreground">Admin</p>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Verification subscriptions and every Sub-pay invoice.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Sub-pay this month" value={ugx(revenue.subPayThisMonth)} />
        <Tile label="Badges showing" value={String(revenue.activeBadges)} />
        <Tile label="Monthly / annual plans" value={`${count("MONTHLY")} / ${count("ANNUAL")}`} />
        <Tile label="Open invoices" value={`${openTotals._count.id} · ${ugx(openTotals._sum.amount ?? 0)}`} />
      </div>

      <nav className="flex gap-2" aria-label="Filter invoices">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin/billing?status=${f.value}`}
            className={["rounded-full border px-3 py-1.5 text-xs font-medium", status === f.value ? "border-foreground bg-foreground text-background" : "border-border hover:bg-surface"].join(" ")}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>
              {["Invoice", "Creator", "Plan", "Amount", "Status", "Due / paid", ""].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {invoices.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No invoices here.</td></tr>
            )}
            {invoices.map((i) => {
              const overdue = i.status === "OPEN" && i.due_at < new Date()
              return (
                <tr key={i.id}>
                  <td className="px-4 py-2.5 font-mono text-xs">{invoiceNumber(i.id)}</td>
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/users/${i.user.id}`} className="font-medium hover:underline">@{i.user.username ?? i.user.email}</Link>
                  </td>
                  <td className="px-4 py-2.5">{PLANS[i.plan as Plan]?.label ?? i.plan}</td>
                  <td className="px-4 py-2.5">{ugx(i.amount)}</td>
                  <td className="px-4 py-2.5 text-xs">
                    <span className={[
                      "rounded-full px-2 py-0.5 font-medium",
                      i.status === "PAID" ? "bg-success-bg text-success" : overdue ? "bg-error-bg text-error" : i.status === "OPEN" ? "bg-warning-bg text-warning" : "bg-surface text-muted-foreground",
                    ].join(" ")}>
                      {overdue ? "Overdue" : i.status.charAt(0) + i.status.slice(1).toLowerCase()}
                    </span>
                    {i.payment_method && <span className="ml-1 text-muted-foreground">{i.payment_method.toLowerCase()}</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{i.paid_at ? `paid ${day(i.paid_at)}` : `due ${day(i.due_at)}`}</td>
                  <td className="px-4 py-2.5">
                    {i.status === "OPEN" && (
                      <span className="flex gap-2">
                        <AdminAction url={`/api/admin/invoices/${i.id}`} body={{ action: "mark_paid" }} label="Mark paid" confirm="Record this invoice as paid outside Sub-pay? Their subscription extends and they get a receipt." tone="success" />
                        <AdminAction url={`/api/admin/invoices/${i.id}`} body={{ action: "void" }} label="Void" confirm="Void this invoice?" tone="danger" />
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-lg font-semibold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
