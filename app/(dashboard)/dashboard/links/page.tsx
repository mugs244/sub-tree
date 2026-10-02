import { getSession } from "@/lib/auth/session"
import { listLinks } from "@/lib/services/link"
import { availableConnectProviders } from "@/lib/services/connect"
import { LinksManager } from "@/components/LinksManager"

type Props = { searchParams: Promise<{ connected?: string; link?: string; connect_error?: string }> }

const CONNECT_ERRORS: Record<string, string> = {
  denied: "Sign-in was cancelled, so nothing was added.",
  expired: "That sign-in took too long — please try connecting again.",
  not_configured: "That platform can't be connected yet — add it by typing your username instead.",
  no_channel: "That Google account doesn't have a YouTube channel — try another account or type your @handle.",
}

export default async function LinksPage({ searchParams }: Props) {
  const session = await getSession()
  const userId = session!.userId
  const [links, sp] = await Promise.all([listLinks(userId), searchParams])

  const linkId = Number(sp.link)
  const connected = sp.connected && Number.isInteger(linkId) ? { provider: sp.connected, linkId } : null
  const connectError = sp.connect_error ? CONNECT_ERRORS[sp.connect_error] ?? "Couldn't connect that account — please try again." : null

  return (
    <div className="px-4 py-5 md:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Links</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {links.length} link{links.length !== 1 ? "s" : ""}
        </p>
      </div>
      <LinksManager initialLinks={links} connectProviders={availableConnectProviders()} connected={connected} connectError={connectError} />
    </div>
  )
}
