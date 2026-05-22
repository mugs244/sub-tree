import { auth } from "@clerk/nextjs/server"
import { listLinks } from "@/lib/services/link"
import { LinksManager } from "@/components/LinksManager"

export default async function LinksPage() {
  const { userId } = await auth()
  const links = await listLinks(userId!)

  return (
    <div className="px-4 py-5 md:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Links</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {links.length} link{links.length !== 1 ? "s" : ""} · drag to reorder
        </p>
      </div>
      <LinksManager initialLinks={links} />
    </div>
  )
}
