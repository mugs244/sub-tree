"use client"

import { useState } from "react"
import { Heart, Pin, Trash2, Pencil, Link2, X, Check } from "lucide-react"

type PostLink = { id: number; url: string; smart_card_meta: unknown }

type Post = {
  id: number
  content: string | null
  visibility: "PUBLIC" | "SUPPORTERS_ONLY" | "SUBSCRIBERS_ONLY"
  is_pinned: boolean
  like_count: number
  view_count: number
  published_at: Date | string
  links: PostLink[]
}

interface Props {
  initialPosts: Post[]
}

const VISIBILITY_LABELS: Record<string, string> = {
  PUBLIC: "Public",
  SUPPORTERS_ONLY: "Supporters only",
  SUBSCRIBERS_ONLY: "Subscribers only",
}

export function PostsClient({ initialPosts }: Props) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [composerText, setComposerText] = useState("")
  const [composerLink, setComposerLink] = useState("")
  const [composerVisibility, setComposerVisibility] = useState<Post["visibility"]>("PUBLIC")
  const [publishing, setPublishing] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState("")
  const [editVisibility, setEditVisibility] = useState<Post["visibility"]>("PUBLIC")
  const [editLink, setEditLink] = useState("")
  const [savingId, setSavingId] = useState<number | null>(null)

  async function handlePublish() {
    if (!composerText.trim() && !composerLink.trim()) return
    setPublishing(true)
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: composerText.trim() || undefined,
        visibility: composerVisibility,
        link_url: composerLink.trim() || undefined,
      }),
    })
    if (res.ok) {
      const { data } = await res.json() as { data: { id: number } }
      const newPost: Post = {
        id: data.id,
        content: composerText.trim() || null,
        visibility: composerVisibility,
        is_pinned: false,
        like_count: 0,
        view_count: 0,
        published_at: new Date().toISOString(),
        links: composerLink.trim() ? [{ id: 0, url: composerLink.trim(), smart_card_meta: null }] : [],
      }
      setPosts([newPost, ...posts])
      setComposerText("")
      setComposerLink("")
      setComposerVisibility("PUBLIC")
    }
    setPublishing(false)
  }

  function startEdit(post: Post) {
    setEditingId(post.id)
    setEditText(post.content ?? "")
    setEditVisibility(post.visibility)
    setEditLink(post.links[0]?.url ?? "")
  }

  async function saveEdit(id: number) {
    setSavingId(id)
    const res = await fetch(`/api/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: editText.trim() || null,
        visibility: editVisibility,
        link_url: editLink.trim() || null,
      }),
    })
    if (res.ok) {
      setPosts(posts.map((p) =>
        p.id === id
          ? {
              ...p,
              content: editText.trim() || null,
              visibility: editVisibility,
              links: editLink.trim() ? [{ id: p.links[0]?.id ?? 0, url: editLink.trim(), smart_card_meta: null }] : [],
            }
          : p
      ))
      setEditingId(null)
    }
    setSavingId(null)
  }

  async function handlePin(id: number) {
    const res = await fetch(`/api/posts/${id}/pin`, { method: "POST" })
    if (res.ok) {
      setPosts(posts.map((p) => ({ ...p, is_pinned: p.id === id })))
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this post?")) return
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" })
    if (res.ok) setPosts(posts.filter((p) => p.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Posts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Share updates with your followers</p>
      </div>

      {/* Composer */}
      <div className="bg-background border border-border rounded-xl p-4 space-y-3">
        <textarea
          value={composerText}
          onChange={(e) => setComposerText(e.target.value)}
          placeholder="What's on your mind?"
          rows={3}
          maxLength={5000}
          className="w-full text-sm bg-transparent resize-none focus:outline-none placeholder:text-muted-foreground"
        />

        <div className="flex items-center gap-2 border-t border-border pt-3">
          <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="url"
            value={composerLink}
            onChange={(e) => setComposerLink(e.target.value)}
            placeholder="Paste a link (optional)"
            className="flex-1 text-xs bg-transparent focus:outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <select
            value={composerVisibility}
            onChange={(e) => setComposerVisibility(e.target.value as Post["visibility"])}
            className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background focus:outline-none"
          >
            <option value="PUBLIC">Public</option>
            <option value="SUPPORTERS_ONLY">Supporters only</option>
            <option value="SUBSCRIBERS_ONLY">Subscribers only</option>
          </select>

          <button
            onClick={handlePublish}
            disabled={publishing || (!composerText.trim() && !composerLink.trim())}
            className="px-4 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-40"
          >
            {publishing ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      {/* Post list */}
      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No posts yet. Publish your first one above.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-background border border-border rounded-xl p-4 space-y-3">
              {/* Header badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {post.is_pinned && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                    <Pin className="h-3 w-3" /> Pinned
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {VISIBILITY_LABELS[post.visibility]}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {new Date(post.published_at).toLocaleDateString()}
                </span>
              </div>

              {editingId === post.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                    maxLength={5000}
                    className="w-full text-sm bg-muted/50 rounded-lg px-3 py-2 resize-none focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <Link2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <input
                      type="url"
                      value={editLink}
                      onChange={(e) => setEditLink(e.target.value)}
                      placeholder="Link URL (optional)"
                      className="flex-1 text-xs bg-muted/50 rounded px-2 py-1 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={editVisibility}
                      onChange={(e) => setEditVisibility(e.target.value as Post["visibility"])}
                      className="text-xs border border-border rounded px-2 py-1 bg-background focus:outline-none"
                    >
                      <option value="PUBLIC">Public</option>
                      <option value="SUPPORTERS_ONLY">Supporters only</option>
                      <option value="SUBSCRIBERS_ONLY">Subscribers only</option>
                    </select>
                    <button
                      onClick={() => void saveEdit(post.id)}
                      disabled={savingId === post.id}
                      className="flex items-center gap-1 px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded-lg disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      {savingId === post.id ? "Saving…" : "Save"}
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {post.content && (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  )}
                  {post.links[0] && (
                    <a
                      href={post.links[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs text-primary underline underline-offset-2 truncate"
                    >
                      <Link2 className="h-3.5 w-3.5 shrink-0" />
                      {post.links[0].url}
                    </a>
                  )}
                </>
              )}

              {/* Footer actions */}
              <div className="flex items-center gap-4 pt-1 border-t border-border">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="h-3.5 w-3.5" />
                  {post.like_count}
                </span>
                <div className="flex items-center gap-1 ml-auto">
                  {!post.is_pinned && (
                    <button
                      onClick={() => void handlePin(post.id)}
                      title="Pin post"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(post)}
                    title="Edit post"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => void handleDelete(post.id)}
                    title="Delete post"
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
