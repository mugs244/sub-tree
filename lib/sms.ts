// Africa's Talking SMS via REST API
// Docs: https://developers.africastalking.com/docs/sms/sending
//
// Required env vars:
//   AFRICASTALKING_USERNAME   — use "sandbox" for dev, your app username for prod
//   AFRICASTALKING_API_KEY    — from Africa's Talking dashboard
//
// Phone numbers must be in international format: +256XXXXXXXXX

const AT_BASE =
  process.env.AFRICASTALKING_USERNAME === "sandbox"
    ? "https://api.sandbox.africastalking.com/version1/messaging"
    : "https://api.africastalking.com/version1/messaging"

export async function sendSms(to: string, message: string): Promise<void> {
  const username = process.env.AFRICASTALKING_USERNAME
  const apiKey = process.env.AFRICASTALKING_API_KEY
  if (!username || !apiKey) return

  // Normalize to international format
  const normalized = to.startsWith("+") ? to : `+${to.replace(/^0/, "256")}`

  try {
    const body = new URLSearchParams({ username, to: normalized, message })
    await fetch(AT_BASE, {
      method: "POST",
      headers: {
        apiKey,
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    })
  } catch (err) {
    // SMS failure must never crash the payment flow
    console.error("SMS send failed", { to: normalized, err })
  }
}
