import { API_BASE_URL } from "./config"
import { getToken } from "./auth-storage"

export class ApiError extends Error {}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(data?.error ?? "Something went wrong")
  }
  return data as T
}

export function signUp(email: string, password: string, agreedToTerms: boolean) {
  return request<{ userId: number }>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, agreedToTerms }),
  })
}

export function verifyEmail(userId: number, code: string) {
  return request<{ ok: true; token: string }>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ userId, code }),
  })
}

export function signIn(email: string, password: string) {
  return request<{ ok: true; isAdmin: boolean; token: string }>("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export function signOut() {
  return request<{ ok: true }>("/api/auth/signout", { method: "POST" })
}

export interface NotificationItem {
  id: number
  type: string
  title: string
  body: string
  read_at: string | null
  created_at: string
}

export function listNotifications() {
  return request<{ data: NotificationItem[] }>("/api/notifications")
}
