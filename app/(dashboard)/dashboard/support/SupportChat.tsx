"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  id: number
  body: string
  is_from_admin: boolean
  read_at: string | null
  created_at: string
  sender: { username: string | null; email: string }
}

export function SupportChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/support/messages")
      if (!res.ok) return
      const { data } = (await res.json()) as { data: Message[] }
      setMessages(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMessages()
    fetch("/api/support/messages/read", { method: "POST" }).catch(() => {})
    const interval = setInterval(fetchMessages, 8_000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  async function send() {
    const body = draft.trim()
    if (!body) return
    setSending(true)
    setDraft("")
    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      })
      if (res.ok) await fetchMessages()
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] border border-border rounded-xl overflow-hidden bg-background">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Send a message and the Sub-tree team will get back to you here.
          </p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.is_from_admin ? "justify-start" : "justify-end"}`}>
            <div
              className={[
                "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                m.is_from_admin ? "bg-surface text-foreground" : "bg-foreground text-background",
              ].join(" ")}
            >
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <p className={["text-[10px] mt-1", m.is_from_admin ? "text-muted-foreground" : "text-background/60"].join(" ")}>
                {m.is_from_admin ? "Sub-tree support" : "You"} ·{" "}
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
          placeholder="Message Sub-tree support…"
          rows={1}
          className="flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button onClick={() => void send()} disabled={sending || !draft.trim()} size="icon" aria-label="Send message">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
