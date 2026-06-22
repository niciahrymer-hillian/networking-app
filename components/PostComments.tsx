"use client";
// Comments for a feed/profile post: a "💬 N comments" toggle that expands a
// thread (top-level comments + one level of replies) with a composer and inline
// reply boxes. Loads on first open from GET /api/posts/:id/comments.

import { useState } from "react";
import MentionText from "@/components/MentionText";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  parentId: string | null;
  author: { username: string; name: string | null; headshotUrl: string | null };
};

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(d).toLocaleDateString();
}

function Avatar({ name, username, url }: { name: string | null; username: string; url: string | null }) {
  const label = name ?? `@${username}`;
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={label} className="h-7 w-7 shrink-0 rounded-full object-cover ring-1 ring-line" />
  ) : (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-300">
      {label.replace(/^@/, "").charAt(0).toUpperCase()}
    </div>
  );
}

export default function PostComments({ postId, initialCount }: { postId: string; initialCount: number }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [count, setCount] = useState(initialCount);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !loaded) {
      const r = await fetch(`/api/posts/${postId}/comments`).then((x) => x.json()).catch(() => ({ comments: [] }));
      setComments(r.comments ?? []);
      setLoaded(true);
    }
  }

  async function submit(body: string, parentId: string | null, clear: () => void) {
    if (!body.trim() || busy) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, parentId }),
      }).then((x) => x.json());
      if (r.comment) {
        setComments((c) => [...c, r.comment]);
        setCount((n) => n + 1);
        clear();
        setReplyTo(null);
      }
    } finally {
      setBusy(false);
    }
  }

  const topLevel = comments.filter((c) => !c.parentId);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={toggle}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-body"
      >
        💬 {count} comment{count !== 1 ? "s" : ""}
      </button>

      {open && (
        <div className="mt-2 space-y-3">
          {/* New top-level comment */}
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit(draft, null, () => setDraft(""))}
              placeholder="Add a comment…"
              className="flex-1 rounded-full bg-elevated px-4 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="button"
              onClick={() => submit(draft, null, () => setDraft(""))}
              disabled={busy || !draft.trim()}
              className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-emerald-500"
            >
              Post
            </button>
          </div>

          {topLevel.map((c) => (
            <div key={c.id} className="space-y-2">
              <div className="flex gap-2">
                <Avatar name={c.author.name} username={c.author.username} url={c.author.headshotUrl} />
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl bg-elevated px-3 py-2">
                    <p className="text-sm font-semibold text-foreground">
                      {c.author.name ?? `@${c.author.username}`} <span className="ml-1 text-xs font-normal text-muted">{timeAgo(c.createdAt)}</span>
                    </p>
                    <p className="text-sm text-body whitespace-pre-wrap break-words"><MentionText text={c.body} /></p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyDraft(""); }}
                    className="mt-0.5 px-2 text-xs font-medium text-muted hover:text-emerald-700"
                  >
                    Reply
                  </button>

                  {/* Replies */}
                  {repliesOf(c.id).map((r) => (
                    <div key={r.id} className="mt-2 flex gap-2 pl-3">
                      <Avatar name={r.author.name} username={r.author.username} url={r.author.headshotUrl} />
                      <div className="min-w-0 flex-1 rounded-2xl bg-elevated px-3 py-2">
                        <p className="text-sm font-semibold text-foreground">
                          {r.author.name ?? `@${r.author.username}`} <span className="ml-1 text-xs font-normal text-muted">{timeAgo(r.createdAt)}</span>
                        </p>
                        <p className="text-sm text-body whitespace-pre-wrap break-words"><MentionText text={r.body} /></p>
                      </div>
                    </div>
                  ))}

                  {/* Reply composer */}
                  {replyTo === c.id && (
                    <div className="mt-2 flex gap-2 pl-3">
                      <input
                        value={replyDraft}
                        onChange={(e) => setReplyDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && submit(replyDraft, c.id, () => setReplyDraft(""))}
                        placeholder={`Reply to ${c.author.name ?? c.author.username}…`}
                        autoFocus
                        className="flex-1 rounded-full bg-elevated px-4 py-1.5 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => submit(replyDraft, c.id, () => setReplyDraft(""))}
                        disabled={busy || !replyDraft.trim()}
                        className="rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-emerald-500"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
