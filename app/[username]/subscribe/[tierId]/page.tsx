import { notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { PageViewTracker } from "@/components/PageViewTracker"

type Props = { params: { username: string; tierId: string } }

export default async function CreatorTierSubscribePage({ params }: Props) {
  const tierId = Number(params.tierId)
  if (Number.isNaN(tierId)) notFound()

  const tier = await prisma.membershipTier.findFirst({
    where: {
      id: tierId,
      is_active: true,
      creator: {
        username: params.username,
        deleted_at: null,
      },
    },
    select: {
      id: true,
      name: true,
      description: true,
      price_ugx: true,
      perks: true,
      position: true,
      creator: {
        select: {
          username: true,
          profile: { select: { display_name: true } },
        },
      },
    },
  })

  if (!tier) notFound()

  const displayName = tier.creator.profile?.display_name ?? tier.creator.username
  const price = Number(tier.price_ugx)

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <PageViewTracker username={params.username} />
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Subscribe to {displayName}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{tier.name}</h1>
          <p className="text-lg font-semibold text-foreground">
            {new Intl.NumberFormat("en-UG", {
              style: "currency",
              currency: "UGX",
              maximumFractionDigits: 0,
            }).format(price)}
            /mo
          </p>
        </div>

        <section className="rounded-3xl border border-border bg-surface p-6 space-y-5">
          {tier.description ? (
            <p className="text-sm text-muted-foreground">{tier.description}</p>
          ) : (
            <p className="text-sm text-muted-foreground">This tier does not have a description yet.</p>
          )}

          {Array.isArray(tier.perks) && tier.perks.length > 0 ? (
            <div>
              <p className="text-sm font-semibold mb-3">Included perks</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {tier.perks.map((perk, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="rounded-3xl border border-border bg-background p-5">
            <p className="text-sm text-muted-foreground">
              Creator membership checkout is being built. This placeholder page is the next step toward fan subscription flow for membership tiers.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              When recurring payments are available, fans will be able to join this tier and unlock subscriber-only content.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              href={`/${params.username}`}
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted/10"
            >
              Back to profile
            </a>
            <button
              disabled
              className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground opacity-70"
            >
              Checkout coming soon
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
