import { getSession } from "@/lib/auth/session"
import { redirect } from "next/navigation"
import { SupportChat } from "./SupportChat"

export const metadata = { title: "Support" }

export default async function SupportPage() {
  const session = await getSession()
  if (!session) redirect("/sign-in")

  return (
    <div className="px-4 py-5 md:p-8 max-w-2xl space-y-4 h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Message the Sub-tree team directly — we usually reply within a day.
        </p>
      </div>
      <SupportChat />
    </div>
  )
}
