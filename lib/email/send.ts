import { AsyncLocalStorage } from "node:async_hooks"
import { Resend } from "resend"

// Every Sub-tree email goes through here. Resend doesn't throw when it
// rejects an email (bad key, unverified domain, bad address) — it returns
// `{ error }` — so this is the one place that checks and logs it.
// Never throws: an email failure must not break the action that sent it.

const resend = new Resend(process.env.RESEND_API_KEY)
export const EMAIL_FROM = "Sub-tree <hello@sub-tree.com>"

export interface EmailResult {
  to: string
  subject: string
  ok: boolean
  id?: string
  error?: string
}

// Admin email tester: inside runEmailTest() every send is recorded so the
// tester can show what Resend said, and SMS is switched off.
const testRun = new AsyncLocalStorage<EmailResult[]>()

export async function runEmailTest(fn: () => Promise<unknown>): Promise<EmailResult[]> {
  const results: EmailResult[] = []
  await testRun.run(results, fn)
  return results
}

export function isEmailTestRun(): boolean {
  return testRun.getStore() !== undefined
}

export async function sendEmail({ to, subject: realSubject, html }: { to: string; subject: string; html: string }): Promise<EmailResult> {
  const subject = isEmailTestRun() ? `[Test] ${realSubject}` : realSubject
  let result: EmailResult
  if (!process.env.RESEND_API_KEY) {
    result = { to, subject, ok: false, error: "RESEND_API_KEY isn't set" }
  } else {
    try {
      const { data, error } = await resend.emails.send({ from: EMAIL_FROM, to, subject, html })
      result = error ? { to, subject, ok: false, error: `${error.name}: ${error.message}` } : { to, subject, ok: true, id: data?.id }
    } catch (err) {
      result = { to, subject, ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  }
  if (!result.ok) console.error("Email send failed", result)
  testRun.getStore()?.push(result)
  return result
}
