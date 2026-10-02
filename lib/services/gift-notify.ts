import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email/send"
import { emailLayout, heading, greeting, p, amountCard, details, notice, button } from "@/lib/email/template"

// Gifts of this size or more get an email to the creator (no SMS). Smaller
// gifts only show in the dashboard's Activity feed.
export const LARGE_GIFT_UGX = 5_000

const fmt = (n: number) => `UGX ${Math.round(n).toLocaleString("en-UG")}`

export interface GiftEmail {
  userId: number
  amount: number
  creatorAmount: number | null
  donorName: string | null
  note: string | null
  receivedAt?: Date
}

export async function emailGiftReceived(g: GiftEmail): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: g.userId },
    select: { email: true, username: true, profile: { select: { display_name: true } } },
  })
  if (!user?.email) return

  const from = g.donorName?.trim() || "Someone"
  const when = (g.receivedAt ?? new Date()).toLocaleString("en-UG", { timeZone: "Africa/Kampala", dateStyle: "medium", timeStyle: "short" })
  const rows: [string, string][] = [
    ["From", from],
    ["Received", when],
    ["Gift", fmt(g.amount)],
    ...(g.creatorAmount != null
      ? [["Sub-tree fee", `− ${fmt(g.amount - g.creatorAmount)}`] as [string, string], ["Added to your balance", fmt(g.creatorAmount)] as [string, string]]
      : []),
  ]

  await sendEmail({
    to: user.email,
    subject: `${from} sent you a ${fmt(g.amount)} gift`,
    html: emailLayout({
      preheader: g.creatorAmount != null ? `${fmt(g.creatorAmount)} has been added to your Sub-tree balance.` : `A new gift on Sub-tree.`,
      body:
        heading("You received a gift") +
        greeting(user.profile?.display_name ?? user.username ?? "there") +
        p(`${from} just sent you a gift on Sub-tree.`) +
        amountCard("Gift received", fmt(g.amount), g.creatorAmount != null ? `${fmt(g.creatorAmount)} to your balance after fees` : undefined) +
        (g.note?.trim() ? notice(`“${g.note.trim()}”`) : "") +
        details(rows, { emphasiseLast: g.creatorAmount != null }) +
        button("Open your wallet", "https://sub-tree.com/dashboard") +
        p(`You get an email for every gift of ${fmt(LARGE_GIFT_UGX)} or more. Smaller gifts show in your Activity feed.`, { muted: true, size: 13 }),
    }),
  })
}
