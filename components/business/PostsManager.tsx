"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface Post {
  id: number
  content: string
  createdAt: string
  authorName: string
  commentCount: number
}

interface Comment {
  id: number
  body: string
  createdAt: string
  authorName: string
}

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" })
}

function CommentThread({ postId }: { postId: number }) {
  const [comments, setComments] = useState<Comment[] | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch(`/api/business/posts/${postId}/comments`)
      const json = await res.json()
      if (res.ok) setComments(json.data)
    } finally {
      setLoading(false)
    }
  }

  if (comments === null) {
    return (
      <button onClick={() => void load()} disabled={loading} className="text-xs text-muted-foreground hover:text-foreground">
        {loading ? "Loading…" : "Read comments"}
      </button>
    )
  }

  return (
    <div className="space-y-2 pt-1">
      {comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No comments yet</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="text-xs bg-background border border-border rounded-lg p-2.5">
            <p className="font-medium">{c.authorName}</p>
            <p className="text-muted-foreground mt-0.5">{c.body}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{fmtWhen(c.createdAt)}</p>
          </div>
        ))
      )}
    </div>
  )
}

export function PostsManager({ initialPosts }: { initialPosts: Post[] }) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  async function publish() {
    setPosting(true)
    setError(null)
    try {
      const res = await fetch("/api/business/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.message ?? "Could not publish post")
        return
      }
      setContent("")
      router.refresh()
    } catch {
      setError("Network error — please try again")
    } finally {
      setPosting(false)
    }
  }

  async function remove(postId: number) {
    setBusyId(postId)
    try {
      const res = await fetch(`/api/business/posts/${postId}`, { method: "DELETE" })
      if (res.ok) router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="px-4 py-5 md:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Posts</h1>
        <p className="text-sm text-muted-foreground mt-1">Company updates. Comments live inside each post.</p>
      </div>

      <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          placeholder="Share an update from your business…"
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <div className="flex justify-end">
          <Button onClick={() => void publish()} disabled={posting || content.trim() === ""}>
            {posting ? "Posting…" : "Post"}
          </Button>
        </div>
      </div>

      {initialPosts.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center border border-border rounded-xl">
          No posts yet
        </p>
      ) : (
        <div className="space-y-3">
          {initialPosts.map((p) => (
            <div key={p.id} className="bg-surface border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{p.authorName} · {fmtWhen(p.createdAt)}</p>
                </div>
                <button
                  onClick={() => void remove(p.id)}
                  disabled={busyId === p.id}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                  aria-label="Delete post"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                </button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{p.content}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t border-border pt-2">
                <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
                {p.commentCount} comment{p.commentCount === 1 ? "" : "s"}
              </div>
              <CommentThread postId={p.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
