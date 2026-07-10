"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Send, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Thread {
  userId: number
  user: { username: string | null; email: string } | null
  lastMessage: { body: string; is_from_admin: boolean; created_at: string } | null
  unreadCount: number
}

interface Message {
  id: number
  body: string
  is_from_admin: boolean
  created_at: string
  sender: { username: string | null; email: string }
}

export function SupportInbox() {
  const [threads, setThreads] = useState<Thread[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchThreads = useCallback(async () => {
    const res = await fetch("/api/admin/support/threads")
    if (!res.ok) return
    const { data } = (await res.json()) as { data: Thread[] }
    setThreads(data)
  }, [])

  const fetchMessages = useCallback(async (userId: number) => {
    const res = await fetch(`/api/admin/support/${userId}/messages`)
    if (!res.ok) return
    const { data } = (await res.json()) as { data: Message[] }
    setMessages(data)
  }, [])

  useEffect(() => {
    fetchThreads()
    const interval = setInterval(fetchThreads, 8_000)
    return () => clearInterval(interval)
  }, [fetchThreads])

  useEffect(() => {
    if (selected === null) return
    fetchMessages(selected)
    fetch(`/api/admin/support/${selected}/read`, { method: "POST" }).catch(() => {})
    const interval = setInterval(() => fetchMessages(selected), 8_000)
    return () => clearInterval(interval)
  }, [selected, fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  async function send() {
    const body = draft.trim()
    if (!body || selected === null) return
    setSending(true)
    setDraft("")
    try {
      const res = await fetch(`/api/admin/support/${selected}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      })
      if (res.ok) {
        await fetchMessages(selected)
        await fetchThreads()
      }
    } finally {
      setSending(false)
    }
  }

  const selectedThread = threads.find((t) => t.userId === selected)

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background h-[calc(100vh-10rem)] flex">
      {/* ── Thread list ─────────────────────────────────── */}
      <div className={`w-full md:w-72 shrink-0 border-r border-border overflow-y-auto ${selected !== null ? "hidden md:block" : ""}`}>
        {threads.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8 px-4">No support conversations yet.</p>
        )}
        {threads.map((t) => (
          <button
            key={t.userId}
            onClick={() => setSelected(t.userId)}
            className={[
              "w-full text-left px-4 py-3 border-b border-border hover:bg-surface transition-colors duration-150",
              selected === t.userId ? "bg-surface" : "",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium truncate">{t.user?.username ?? t.user?.email ?? `User #${t.userId}`}</p>
              {t.unreadCount > 0 && (
                <span className="shrink-0 h-5 min-w-5 px-1 rounded-full bg-foreground text-background text-[10px] font-medium flex items-center justify-center">
                  {t.unreadCount}
                </span>
              )}
            </div>
            {t.lastMessage && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {t.lastMessage.is_from_admin ? "You: " : ""}{t.lastMessage.body}
              </p>
            )}
          </button>
        ))}
      </div>

      {/* ── Conversation ────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 ${selected === null ? "hidden md:flex" : ""}`}>
        {selected === null ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Select a conversation
          </div>
        ) : (
          <>
            <div className="border-b border-border px-4 py-3 flex items-center gap-2">
              <button onClick={() => setSelected(null)} className="md:hidden" aria-label="Back to list">
                <ArrowLeft className="h-4 w-4" />
              </button>
              <p className="text-sm font-medium">{selectedThread?.user?.username ?? selectedThread?.user?.email ?? `User #${selected}`}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.is_from_admin ? "justify-end" : "justify-start"}`}>
                  <div
                    className={[
                      "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                      m.is_from_admin ? "bg-foreground text-background" : "bg-surface text-foreground",
                    ].join(" ")}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className={["text-[10px] mt-1", m.is_from_admin ? "text-background/60" : "text-muted-foreground"].join(" ")}>
                      {new Date(m.created_at).toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="border-t border-border p-3 flex gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
                placeholder="Reply…"
                rows={1}
                className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button onClick={() => void send()} disabled={sending || !draft.trim()} size="icon" aria-label="Send reply">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
