// Shared look for every Sub-tree email: off-white page, white rounded card,
// the logo on top, orange for codes and buttons, a dark card for amounts.
//
// Emails are plain HTML strings with inline styles and tables — email apps
// (Gmail, Outlook, Apple Mail) ignore <style> blocks, flexbox and SVG, so
// everything here sticks to what they all render. Text passed in is
// escaped; pass `html` only for markup you built yourself.

const SITE = "https://sub-tree.com"

const C = {
  canvas: "#eeede8",
  card: "#ffffff",
  ink: "#111827",
  text: "#374151",
  muted: "#6b7280",
  faint: "#9ca3af",
  line: "#ece9e2",
  orange: "#ff8a3d",
  orangeText: "#c2410c",
  orangeSoft: "#fff1e6",
  redText: "#b91c1c",
  redSoft: "#fef2f2",
  greenText: "#15803d",
  greenSoft: "#f0fdf4",
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"
const MONO = "'SFMono-Regular',Menlo,Consolas,'Liberation Mono',monospace"

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

// ── Building blocks ────────────────────────────────────────────────────────

export function heading(text: string): string {
  return `<h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;font-weight:800;letter-spacing:-0.02em;color:${C.ink}">${esc(text)}</h1>`
}

/** A paragraph. Use `html` for text that already contains your own markup (e.g. <strong>). */
export function p(text: string, opts: { html?: boolean; muted?: boolean; size?: number } = {}): string {
  const body = opts.html ? text : esc(text)
  return `<p style="margin:0 0 14px;font-size:${opts.size ?? 15}px;line-height:1.6;color:${opts.muted ? C.muted : C.text}">${body}</p>`
}

export function strong(text: string): string {
  return `<strong style="color:${C.ink}">${esc(text)}</strong>`
}

/** The one-time code, big and easy to copy. */
export function codeBox(code: string, expiresMinutes = 10): string {
  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 18px">
    <tr><td align="center" style="background:${C.orangeSoft};border:2px dashed ${C.orange};border-radius:18px;padding:22px 12px">
      <div style="font-family:${MONO};font-size:36px;font-weight:700;letter-spacing:10px;color:${C.ink}">${esc(code)}</div>
      <div style="margin-top:8px;font-size:12px;color:${C.orangeText}">Expires in ${expiresMinutes} minutes</div>
    </td></tr>
  </table>`
}

/** Orange call-to-action button. */
export function button(label: string, href: string): string {
  return `
  <table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px 0 18px">
    <tr><td style="border-radius:999px;background:${C.orange}">
      <a href="${esc(href)}" style="display:inline-block;padding:14px 26px;font-size:15px;font-weight:700;color:${C.ink};text-decoration:none;border-radius:999px">${esc(label)}</a>
    </td></tr>
  </table>`
}

/** Dark "money" card: label, big amount, optional line under it. */
export function amountCard(label: string, amount: string, sub?: string): string {
  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:4px 0 18px">
    <tr><td style="background:${C.ink};border-radius:20px;padding:20px 22px;border-top:4px solid ${C.orange}">
      <div style="font-size:13px;color:#d1d5db">${esc(label)}</div>
      <div style="margin-top:6px;font-size:30px;font-weight:800;letter-spacing:-0.02em;color:#ffffff">${esc(amount)}</div>
      ${sub ? `<div style="margin-top:4px;font-size:13px;color:#d1d5db">${esc(sub)}</div>` : ""}
    </td></tr>
  </table>`
}

/** Label / value rows, e.g. a receipt. The last row can be emphasised. */
export function details(rows: [string, string][], opts: { emphasiseLast?: boolean } = {}): string {
  const tr = rows.map(([label, value], i) => {
    const last = opts.emphasiseLast && i === rows.length - 1
    const top = last ? `border-top:1px solid ${C.line};` : ""
    return `<tr>
      <td style="${top}padding:9px 0;font-size:14px;color:${last ? C.ink : C.muted};${last ? "font-weight:700;" : ""}">${esc(label)}</td>
      <td align="right" style="${top}padding:9px 0;font-size:14px;color:${C.ink};font-family:${MONO};${last ? "font-weight:700;font-size:15px;" : ""}">${esc(value)}</td>
    </tr>`
  }).join("")
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px">${tr}</table>`
}

/** Highlighted note. "info" is orange, "success" green, "danger" red. */
export function notice(text: string, tone: "info" | "success" | "danger" = "info", opts: { html?: boolean } = {}): string {
  const [bg, fg] = tone === "danger" ? [C.redSoft, C.redText] : tone === "success" ? [C.greenSoft, C.greenText] : [C.orangeSoft, C.orangeText]
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:4px 0 16px">
    <tr><td style="background:${bg};border-radius:14px;padding:13px 16px;font-size:13px;line-height:1.55;color:${fg}">${opts.html ? text : esc(text)}</td></tr>
  </table>`
}

/** The standard "never share / wasn't you" footer line for security emails. */
export function securityNote(text = "If this wasn't you, change your password and reply to this email right away."): string {
  return `<p style="margin:18px 0 0;padding-top:16px;border-top:1px solid ${C.line};font-size:12px;line-height:1.55;color:${C.muted}">${esc(text)}</p>`
}

export function greeting(name: string): string {
  return p(`Hi ${name},`)
}

// ── Page ──────────────────────────────────────────────────────────────────

export interface EmailLayoutOptions {
  /** Hidden preview line shown next to the subject in the inbox. */
  preheader: string
  /** Inner HTML for the white card, built from the blocks above. */
  body: string
}

export function emailLayout({ preheader, body }: EmailLayoutOptions): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light only">
<title>Sub-tree</title>
</head>
<body style="margin:0;padding:0;background:${C.canvas};font-family:${FONT};-webkit-font-smoothing:antialiased">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.canvas}">${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.canvas}">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px">
        <tr><td style="padding:0 6px 18px">
          <a href="${SITE}" style="text-decoration:none">
            <table role="presentation" cellspacing="0" cellpadding="0"><tr>
              <td style="vertical-align:middle"><img src="${SITE}/email/icon.png" width="36" height="36" alt="" style="display:block;border:0;border-radius:50%"></td>
              <td style="vertical-align:middle;padding-left:10px;font-size:20px;font-weight:800;letter-spacing:-0.02em;color:${C.ink}">Sub<span style="color:${C.muted}">-</span>tree</td>
            </tr></table>
          </a>
        </td></tr>
        <tr><td style="background:${C.card};border-radius:24px;padding:30px 28px;border:1px solid ${C.line}">
          ${body}
        </td></tr>
        <tr><td align="center" style="padding:20px 12px 0;font-size:12px;line-height:1.6;color:${C.faint}">
          Sub-tree · All your links, one page<br>
          <a href="${SITE}" style="color:${C.faint};text-decoration:underline">sub-tree.com</a> ·
          Questions? Just reply to this email.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
