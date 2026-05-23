import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { FundraiserForm } from "@/components/FundraiserForm"

export default async function NewFundraiserPage() {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  return (
    <div className="px-4 py-5 md:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New fundraiser</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create a campaign and share it with your supporters.
        </p>
      </div>
      <FundraiserForm />
    </div>
  )
}
