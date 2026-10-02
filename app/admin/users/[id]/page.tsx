import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { getUserDetail } from "@/lib/services/admin-console"
import { invoiceNumber, PLANS, type Plan } from "@/lib/services/billing"
import { withdrawalReference } from "@/lib/services/client-wallet"
import { AdminAction } from "@/components/admin/AdminAction"
import { VerifiedBadge } from "@/components/VerifiedBadge"

export const metadata = { title: "User — Admin" }
type Props = { params: Promise<{ id: string }> }

const ugx = (n: number) => `UGX ${Math.round(n).toLocaleString("en-UG")}`
const day = (d: Date | null | undefined) => (d ? d.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" }) : "—")

const PILL: Record<string, string> = {
  COMPLETED: "bg-success-bg text-success", PAID: "bg-success-bg text-success", APPROVED: "bg-success-bg text-success", ACTIVE: "bg-success-bg text-success",
  PENDING: "bg-warning-bg text-warning", PROCESSING: "bg-warning-bg text-warning", OPEN: "bg-warning-bg text-warning", IN_REVIEW: "bg-warning-bg text-warning", SUBMITTED: "bg-warning-bg text-warning",
  FAILED: "bg-error-bg text-error", REJECTED: "bg-error-bg text-error", LAPSED: "bg-error-bg text-error", VOID: "bg-surface text-muted-foreground",
}
function Pill({ s }: { s: string }) {
  return <span className={["rounded-full px-2 py-0.5 text-[11px] font-medium", PILL[s] ?? "bg-surface text-muted-foreground"].join(" ")}>{s.charAt(0) + s.slice(1).toLowerCase().replace("_", " ")}</span>
}

// Everything about one creator in one place, with the actions support needs.
export default async function AdminUserPage({ params }: Props) {
  const id = Number((await params).id)
  const u = Number.isInteger(id) ? await getUserDetail(id) : null
  if (!u) notFound()

  const sub = u.verification_subscription
  const actions = `/api/admin/users/${u.id}/actions`

  return (
    <div className="max-w-5xl space-y-6 px-4 py-5 md:p-8">
      <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All users
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-center gap-4">
        {u.profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={u.profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-2xl font-semibold">
            {(u.profile?.display_name ?? u.username ?? "?").charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            {u.profile?.display_name ?? u.username}
            {u.badgeLive && <VerifiedBadge size={22} />}
          </h1>
          <p className="text-sm text-muted-foreground">@{u.username} · #{u.id} · joined {day(u.created_at)}{u.deleted_at ? " · DELETED" : ""}</p>
        </div>
        {u.username && (
          <a href={`/${u.username}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-surface">
            View page <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card title="Contact & account">
          <Row k="Email" v={`${u.email}${u.email_verified_at ? "" : " (unverified)"}`} />
          <Row k="Phone" v={u.phone ?? "—"} />
          <Row k="Password" v={u.hasPassword ? "Set" : "None (Google only)"} />
          <Row k="Last active" v={day(u.last_active_at)} />
          <Row k="Signed-in sessions" v={String(u._count.sessions)} />
          <div className="pt-2">
            <AdminAction url={actions} body={{ action: "sign_out_all" }} label="Sign out everywhere" confirm="Sign this creator out on every device?" />
          </div>
        </Card>

        <Card title="Wallet & payouts">
          <Row k="Available" v={ugx(u.balance.available)} />
          <Row k="Earned (after fees)" v={ugx(u.balance.earned)} />
          <Row k="Withdrawn" v={ugx(u.balance.withdrawn)} />
          <Row k="Mobile money" v={u.momo_number ?? "—"} />
          <Row k="Bank" v={u.bank_name ? `${u.bank_name} · ${u.bank_account_number} · ${u.bank_account_name}` : "—"} />
        </Card>

        <Card title="Verification badge">
          <Row k="Status" v={u.badgeLive ? "Badge showing" : u.verified_at ? "Verified, badge hidden (unpaid)" : "Not verified"} />
          <Row k="Verified on" v={day(u.verified_at)} />
          <Row k="Name on ID" v={u.verified_name ?? "—"} />
          <Row k="Plan" v={sub ? `${PLANS[sub.plan as Plan]?.label ?? sub.plan} · ${sub.status.toLowerCase()}` : "—"} />
          <Row k="Paid until" v={day(sub?.current_period_end)} />
          <Row k="Auto-renew" v={sub ? [sub.auto_renew_wallet && "wallet", sub.card_recurring && "card"].filter(Boolean).join(" + ") || "off" : "—"} />
          <div className="flex flex-wrap gap-2 pt-2">
            <AdminAction url={actions} body={{ action: "extend_subscription", months: 1 }} label="Give 1 free month" confirm="Extend their subscription by 1 month for free?" tone="success" />
            {u.verified_at && (
              <AdminAction url={actions} body={{ action: "revoke_badge" }} label="Revoke badge" confirm="Remove their verified badge? They'd need a new ID check." tone="danger" />
            )}
          </div>
        </Card>

        <Card title="Page">
          <Row k="Template / theme" v={u.profile?.theme_preset ?? "—"} />
          <Row k="Links" v={String(u._count.links)} />
          <Row k="Profile views" v={String(u.profile?.view_count ?? 0)} />
          <Row k="Country" v={u.profile?.country_code ?? "—"} />
        </Card>
      </div>

      <Table title="Invoices (Sub-pay)" empty="No invoices" head={["Invoice", "Plan", "Amount", "Status", "Due / paid", ""]}
        rows={u.invoices.map((i) => [
          <span key="n" className="font-mono text-xs">{invoiceNumber(i.id)}</span>,
          PLANS[i.plan as Plan]?.label ?? i.plan,
          ugx(i.amount),
          <span key="s"><Pill s={i.status} />{i.payment_method ? <span className="ml-1 text-[11px] text-muted-foreground">{i.payment_method.toLowerCase()}</span> : null}</span>,
          i.paid_at ? `paid ${day(i.paid_at)}` : `due ${day(i.due_at)}`,
          i.status === "OPEN" ? (
            <span key="a" className="flex gap-2">
              <AdminAction url={`/api/admin/invoices/${i.id}`} body={{ action: "mark_paid" }} label="Mark paid" confirm="Record this invoice as paid outside Sub-pay? Their subscription extends and they get a receipt." tone="success" />
              <AdminAction url={`/api/admin/invoices/${i.id}`} body={{ action: "void" }} label="Void" confirm="Void this invoice?" tone="danger" />
            </span>
          ) : null,
        ])}
      />

      <Table title="Withdrawals" empty="No withdrawals" head={["Reference", "Amount", "Net", "Method", "Status", "Date"]}
        rows={u.withdrawals.map((w) => [
          <span key="r" className="font-mono text-xs">{withdrawalReference(w.id)}</span>, ugx(w.amount), ugx(w.net_amount),
          w.payout_method === "BANK" ? "Bank" : "Mobile money", <Pill key="s" s={w.status} />, day(w.created_at),
        ])}
      />

      <Table title="Recent gifts" empty="No gifts yet" head={["From", "Amount", "Via", "Status", "Date"]}
        rows={u.gifts.map((g) => [g.donor_name || "Anonymous", ugx(g.amount), g.provider.replace("_", " ").toLowerCase(), <Pill key="s" s={g.status} />, day(g.created_at)])}
      />

      <Table title="Verification attempts" empty="No attempts" head={["#", "Status", "Smile ID", "Date"]}
        rows={u.verifications.map((v) => [
          String(v.id), <Pill key="s" s={v.status} />,
          <span key="j" className="text-xs"><span className="font-mono">{v.smile_job_id ?? "—"}</span>{v.result_summary ? ` · ${v.result_summary}` : ""}</span>,
          day(v.created_at),
        ])}
      />
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 rounded-xl border border-border p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{k}</span>
      <span className="min-w-0 break-words text-right">{v}</span>
    </div>
  )
}

function Table({ title, head, rows, empty }: { title: string; head: string[]; rows: React.ReactNode[][]; empty: string }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>{head.map((h, i) => <th key={i} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.length === 0 ? (
              <tr><td colSpan={head.length} className="px-4 py-6 text-center text-sm text-muted-foreground">{empty}</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => <td key={j} className="px-4 py-2.5 align-top">{c}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
