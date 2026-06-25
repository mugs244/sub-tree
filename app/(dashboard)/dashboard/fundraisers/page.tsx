import Link from "next/link"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { Plus, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { listFundraisers } from "@/lib/services/fundraiser"
import { FundraiserCard } from "@/components/FundraiserCard"

export default async function FundraisersPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")
  const userId = session.userId

  const fundraisers = await listFundraisers(userId)

  return (
    <div className="px-4 py-5 md:p-8 max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Fundraisers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {fundraisers.length} fundraiser{fundraisers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/fundraisers/new">
            <Plus className="h-4 w-4 mr-2" />
            New fundraiser
          </Link>
        </Button>
      </div>

      {fundraisers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <Target className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No fundraisers yet.</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/fundraisers/new">Create your first fundraiser</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {fundraisers.map((f) => (
            <FundraiserCard key={f.id} fundraiser={f} />
          ))}
        </div>
      )}
    </div>
  )
}
