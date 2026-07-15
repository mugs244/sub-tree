const STORAGE_KEY = "st_cookie_consent"
const CHANGE_EVENT = "st-cookie-consent-changed"

export type ConsentValue = "accepted" | "denied" | null

export function getConsent(): ConsentValue {
  if (typeof window === "undefined") return null
  const value = window.localStorage.getItem(STORAGE_KEY)
  return value === "accepted" || value === "denied" ? value : null
}

export function setConsent(value: Exclude<ConsentValue, null>) {
  window.localStorage.setItem(STORAGE_KEY, value)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function clearConsent() {
  window.localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function onConsentChange(handler: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, handler)
  window.addEventListener("storage", handler)
  return () => {
    window.removeEventListener(CHANGE_EVENT, handler)
    window.removeEventListener("storage", handler)
  }
}
