import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email/send"
import { emailLayout, heading, p, codeBox, button, strong, details, notice } from "@/lib/email/template"
import type { LoginContext } from "@/lib/auth/login-context"

const CODE_TTL_MINUTES = 15

export function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export async function sendVerificationEmail(userId: number, email: string): Promise<void> {
  const code = generateCode()
  const expires_at = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000)

  await prisma.emailVerification.deleteMany({ where: { user_id: userId } })
  await prisma.emailVerification.create({ data: { user_id: userId, code, expires_at } })

  await sendEmail({
    to: email,
    subject: `${code} — your Sub-tree verification code`,
    html: emailLayout({
      preheader: `Your verification code is ${code}`,
      body: heading("Verify your email") + p("Enter this code in Sub-tree to continue:") + codeBox(code, CODE_TTL_MINUTES) + p("If you didn't request this, you can ignore this email.", { muted: true, size: 13 }),
    }),
  })
}

export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Welcome to Sub-tree, @${username}`,
    html: emailLayout({
      preheader: "Your page is ready. Here's how to make the most of it.",
      body:
        heading(`Welcome to Sub-tree, @${username}`) +
        p("We're so happy to have you here. Your page is ready — one link for everything you create, with mobile money donations built in.") +
        p(`Your link: ${strong(`sub-tree.com/${username}`)}`, { html: true }) +
        button("Open your dashboard", "https://sub-tree.com/dashboard") +
        p("Add your links, pick a template, and share your link in your bio. If you ever need help, just reply to this email — a real person will answer.", { muted: true, size: 14 }) +
        p("Let's grow together,<br><strong>The Sub-tree team</strong>", { html: true }),
    }),
  })
}

// Where an attempt came from, shown in code emails so an unexpected one
// stands out.
function attemptBlock(ctx?: LoginContext): string {
  if (!ctx) return ""
  return p("Request details", { size: 13, muted: true }) + details([
    ["When", ctx.time],
    ["Device", ctx.device],
    ...(ctx.location ? [["Near", ctx.location] as [string, string]] : []),
  ])
}

export async function sendSigninCode(userId: number, email: string, ctx?: LoginContext): Promise<void> {
  const code = generateCode()
  const expires_at = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000)

  await prisma.emailVerification.deleteMany({ where: { user_id: userId } })
  await prisma.emailVerification.create({ data: { user_id: userId, code, expires_at } })

  await sendEmail({
    to: email,
    subject: `${code} — your Sub-tree sign-in code`,
    html: emailLayout({
      preheader: `Your sign-in code is ${code}`,
      body:
        heading("Your sign-in code") +
        p("Someone is signing in to your Sub-tree account. Enter this code to continue:") +
        codeBox(code, CODE_TTL_MINUTES) +
        attemptBlock(ctx) +
        notice("Wasn't you? Don't share this code with anyone — your account stays safe as long as nobody has it. If you keep getting these, change your password.", "danger"),
    }),
  })
}

export async function sendPasswordResetCode(userId: number, email: string, ctx?: LoginContext): Promise<void> {
  const code = generateCode()
  const expires_at = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000)

  await prisma.emailVerification.deleteMany({ where: { user_id: userId } })
  await prisma.emailVerification.create({ data: { user_id: userId, code, expires_at } })

  await sendEmail({
    to: email,
    subject: `${code} — reset your Sub-tree password`,
    html: emailLayout({
      preheader: `Your password reset code is ${code}`,
      body:
        heading("Reset your password") +
        p("Enter this code in Sub-tree to set a new password:") +
        codeBox(code, CODE_TTL_MINUTES) +
        attemptBlock(ctx) +
        notice("Didn't ask to reset your password? Ignore this email — your password won't change unless someone enters this code. Never share it.", "danger"),
    }),
  })
}

export async function verifySigninCode(userId: number, code: string): Promise<boolean> {
  const record = await prisma.emailVerification.findFirst({
    where: { user_id: userId, code },
  })
  if (!record) return false
  if (record.expires_at < new Date()) return false
  await prisma.emailVerification.deleteMany({ where: { user_id: userId } })
  return true
}

export async function verifyCode(userId: number, code: string): Promise<boolean> {
  const record = await prisma.emailVerification.findFirst({
    where: { user_id: userId, code },
  })
  if (!record) return false
  if (record.expires_at < new Date()) return false

  await prisma.emailVerification.deleteMany({ where: { user_id: userId } })
  await prisma.user.update({
    where: { id: userId },
    data: { email_verified_at: new Date() },
  })
  return true
}
