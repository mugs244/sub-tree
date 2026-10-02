import Link from "next/link"
import { prisma } from "@/lib/db"
import { listVerificationReviews } from "@/lib/services/verification"
import { canStoreReviewImages, listReviewImageKinds, RETENTION_DAYS, type ImageKind } from "@/lib/services/verification-images"
import { ReviewActions } from "./ReviewActions"

export const metadata = { title: "Verifications" }
type Props = { searchParams: Promise<{ tab?: string }> }

const KIND_LABEL: Record<ImageKind, string> = { id_front: "ID front", id_back: "ID back", selfie: "Face scan" }
const day = (d: Date | null) => (d ? d.toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" }) : "—")

// Verification badge applications. "Needs review" holds Smile ID's
// "attention" results, with the ID photos kept just for this review (deleted
// on decision or after RETENTION_DAYS). "All" lists every attempt.
export default async function AdminVerificationsPage({ searchParams }: Props) {
  const tab = (await searchParams).tab === "all" ? "all" : "review"

  return (
    <div className="max-w-5xl space-y-5 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">Badge applications checked by Smile ID.</p>
      </div>
      <nav className="flex gap-2">
        {[{ v: "review", l: "Needs review" }, { v: "all", l: "All applications" }].map((t) => (
          <Link
            key={t.v}
            href={t.v === "all" ? "/admin/verifications?tab=all" : "/admin/verifications"}
            className={["rounded-full border px-3 py-1.5 text-xs font-medium", tab === t.v ? "border-foreground bg-foreground text-background" : "border-border hover:bg-surface"].join(" ")}
          >
            {t.l}
          </Link>
        ))}
      </nav>
      {tab === "all" ? <AllApplications /> : <Reviews />}
    </div>
  )
}

async function Reviews() {
  const reviews = await listVerificationReviews()
  const withImages = await Promise.all(reviews.map(async (r) => ({ ...r, kinds: await listReviewImageKinds(r.id) })))
  const storing = canStoreReviewImages()

  if (withImages.length === 0) {
    return <p className="rounded-xl border border-border px-4 py-10 text-center text-sm text-muted-foreground">Nothing waiting for review.</p>
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {storing
          ? `ID photos are kept only for these reviews and deleted as soon as you approve or reject (or after ${RETENTION_DAYS} days).`
          : "ID photo previews are off (ID_IMAGES_KEY isn't set) — open each job in the Smile ID portal to see the photos."}
      </p>
      {withImages.map((r) => (
        <article key={r.id} className="space-y-4 rounded-xl border border-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Link href={`/admin/users/${r.user_id}`} className="font-semibold hover:underline">
                {r.user.profile?.display_name ?? r.user.username}
              </Link>
              <p className="text-xs text-muted-foreground">@{r.user.username} · {r.user.email} · submitted {day(r.submitted_at)}</p>
            </div>
            <ReviewActions id={r.id} />
          </div>

          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-muted-foreground">Name on ID</dt><dd className="font-medium">{r.id_full_name ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Display name</dt><dd>{r.user.profile?.display_name ?? "—"}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Smile ID</dt><dd className="text-xs"><span className="font-mono">{r.smile_job_id ?? "no job id"}</span>{r.result_summary ? ` · ${r.result_summary}` : ""}</dd></div>
          </dl>

          {r.kinds.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {(["id_front", "id_back", "selfie"] as ImageKind[]).map((k) =>
                r.kinds.includes(k) ? (
                  <a key={k} href={`/api/admin/verifications/${r.id}/images/${k}`} target="_blank" rel="noopener noreferrer" className="group block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/admin/verifications/${r.id}/images/${k}`}
                      alt={KIND_LABEL[k]}
                      className="aspect-[4/3] w-full rounded-lg border border-border bg-surface object-contain group-hover:opacity-90"
                    />
                    <span className="mt-1 block text-center text-xs text-muted-foreground">{KIND_LABEL[k]} · tap to enlarge</span>
                  </a>
                ) : (
                  <div key={k} className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                    No {KIND_LABEL[k].toLowerCase()}
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="rounded-lg bg-surface px-3 py-2 text-xs text-muted-foreground">
              No photos saved for this case — look it up in the Smile ID portal by job ID.
            </p>
          )}
        </article>
      ))}
    </div>
  )
}

async function AllApplications() {
  const rows = await prisma.verificationRequest.findMany({
    orderBy: { created_at: "desc" },
    take: 100,
    select: {
      id: true, status: true, smile_job_id: true, result_summary: true, created_at: true, user_id: true,
      user: { select: { username: true, profile: { select: { display_name: true } } } },
    },
  })
  const pill: Record<string, string> = {
    APPROVED: "bg-success-bg text-success", REJECTED: "bg-error-bg text-error", IN_REVIEW: "bg-warning-bg text-warning",
    SUBMITTED: "bg-warning-bg text-warning", AWAITING_CAPTURE: "bg-surface text-muted-foreground", ERROR: "bg-surface text-muted-foreground",
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-surface">
          <tr>{["#", "Creator", "Status", "Smile ID", "Started"].map((h) => <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No applications yet.</td></tr>}
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.id}</td>
              <td className="px-4 py-2.5"><Link href={`/admin/users/${r.user_id}`} className="font-medium hover:underline">{r.user.profile?.display_name ?? r.user.username}</Link></td>
              <td className="px-4 py-2.5"><span className={["rounded-full px-2 py-0.5 text-[11px] font-medium", pill[r.status] ?? ""].join(" ")}>{r.status.replace("_", " ").toLowerCase()}</span></td>
              <td className="px-4 py-2.5 text-xs"><span className="font-mono">{r.smile_job_id ?? "—"}</span>{r.result_summary ? ` · ${r.result_summary}` : ""}</td>
              <td className="px-4 py-2.5 text-xs text-muted-foreground">{day(r.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
