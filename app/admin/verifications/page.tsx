import { listVerificationReviews } from "@/lib/services/verification"
import { ReviewActions } from "./ReviewActions"

export const metadata = { title: "Verifications" }

// Smile ID "attention" results waiting for a person to decide. The ID
// photos themselves live in the Smile ID portal (search by job ID) — Sub-tree
// never stores them.
export default async function AdminVerificationsPage() {
  const reviews = await listVerificationReviews()

  return (
    <div className="max-w-5xl space-y-4 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Badge applications Smile ID flagged for a human check. Open the job in the Smile ID portal to see the photos, then decide here.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Creator</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Name on ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Smile ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Submitted</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reviews.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing waiting for review.</td></tr>
            )}
            {reviews.map((r) => (
              <tr key={r.id} className="bg-background">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.user.profile?.display_name ?? r.user.username}</p>
                  <p className="text-xs text-muted-foreground">@{r.user.username} · {r.user.email}</p>
                </td>
                <td className="px-4 py-3">{r.id_full_name ?? "—"}</td>
                <td className="px-4 py-3 text-xs">
                  <p className="font-mono">{r.smile_job_id ?? "no job id"}</p>
                  <p className="text-muted-foreground">{r.result_summary ?? r.smile_result}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {r.submitted_at?.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" }) ?? "—"}
                </td>
                <td className="px-4 py-3"><ReviewActions id={r.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
