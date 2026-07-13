// eSMS Africa SMS API
// Docs: https://esmsafrica.io/documentation/ (endpoint/auth/body confirmed
// directly against a real account — POST .../messages/send, Bearer token,
// JSON body — since the docs site itself is a JS-rendered SPA)
//
// Required env var:
//   ESMSAFRICA_API_KEY — from eSMS Africa dashboard → API Keys
//
// Phone numbers must be in international format: +256XXXXXXXXX

const ESMS_BASE = "https://sms.esmsafrica.io/api/messages/send"

export async function sendSms(to: string, message: string): Promise<void> {
  const apiKey = process.env.ESMSAFRICA_API_KEY
  if (!apiKey) return

  // Normalize to international format
  const normalized = to.startsWith("+") ? to : `+${to.replace(/^0/, "256")}`

  try {
    const res = await fetch(ESMS_BASE, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to: normalized, text: message }),
    })
    if (!res.ok) {
      // A non-2xx response (bad auth, insufficient balance, etc.) doesn't
      // throw — must be checked explicitly or failures go unnoticed.
      console.error("SMS send failed", { to: normalized, status: res.status, body: await res.text().catch(() => "") })
    }
  } catch (err) {
    // SMS failure must never crash the payment/auth flow it's attached to.
    console.error("SMS send failed", { to: normalized, err })
  }
}
