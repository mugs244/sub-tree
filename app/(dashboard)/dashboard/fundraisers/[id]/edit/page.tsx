import { notFound, redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { FundraiserForm } from "@/components/FundraiserForm"

type Props = { params: Promise<{ id: string }> }

export default async function EditFundraiserPage({ params }: Props) {
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { id: raw } = await params
  const id = parseInt(raw, 10)
  if (isNaN(id)) notFound()

  const user = await prisma.user.findUnique({
    where: { clerk_user_id: userId },
    select: { id: true },
  })
  if (!user) redirect("/sign-in")

  const f = await prisma.fundraiser.findUnique({
    where: { id },
    select: {
      id: true, title: true, description: true, goal_amount: true,
      deadline: true, cover_image_url: true, show_progress: true,
      fundraiser_type: true, user_id: true,
    },
  })
  if (!f || f.user_id !== user.id) notFound()

  return (
    <div className="px-4 py-5 md:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit fundraiser</h1>
        <p className="text-sm text-muted-foreground mt-1">{f.title}</p>
      </div>
      <FundraiserForm
        fundraiserId={f.id}
        initial={{
          title:           f.title,
          description:     f.description,
          goal_amount:     Number(f.goal_amount),
          deadline:        f.deadline?.toISOString() ?? null,
          cover_image_url: f.cover_image_url,
          show_progress:   f.show_progress,
          fundraiser_type: f.fundraiser_type,
        }}
      />
    </div>
  )
}
