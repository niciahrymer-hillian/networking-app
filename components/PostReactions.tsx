"use client";
// Reaction bar for a feed/profile post: a React button that opens an emoji
// palette, plus a summary of which reactions a post has and the total count.
// One reaction per user; picking the same one again removes it.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { REACTIONS } from "@/lib/reactions";

export type ReactionCount = { emoji: string; count: number };

export default function PostReactions({
  postId, counts, mine,
}: {
  postId: string;
  counts: ReactionCount[];
  mine: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const total = counts.reduce((n, c) => n + c.count, 0);

  async function react(emoji: string) {
    setOpen(false);
    setBusy(true);
    try {
      await fetch(`/api/posts/${postId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 flex items-center gap-3 border-t border-line pt-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={busy}
          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium transition-colors disabled:opacity-60 ${
            mine
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "text-muted hover:bg-elevated hover:text-body"
          }`}
        >
          <span>{mine ?? "😊"}</span>
          <span>{mine ? "Reacted" : "React"}</span>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
            <div className="absolute bottom-full left-0 z-20 mb-1 flex gap-0.5 rounded-full bg-surface p-1 shadow-lg ring-1 ring-line">
              {REACTIONS.map((r) => (
                <button
                  key={r.emoji}
                  type="button"
                  title={r.label}
                  onClick={() => react(r.emoji)}
                  className={`rounded-full px-1.5 py-1 text-lg leading-none transition-transform hover:scale-125 ${
                    mine === r.emoji ? "bg-emerald-50 dark:bg-emerald-500/10" : ""
                  }`}
                >
                  {r.emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {total > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted">
          <span className="text-sm">{counts.map((c) => c.emoji).join("")}</span>
          <span>{total}</span>
        </div>
      )}
    </div>
  );
}
