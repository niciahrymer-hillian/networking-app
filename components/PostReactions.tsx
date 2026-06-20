"use client";
// Reaction bar for a feed/profile post. The trigger is a line-art smiley icon that
// opens an emoji palette on hover OR click (touch/keyboard friendly). Once you've
// reacted, the trigger shows your chosen emoji. One reaction per user; picking the
// same one again removes it.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { REACTIONS } from "@/lib/reactions";

export type ReactionCount = { emoji: string; count: number };

// Line-art smiley used as the "react" affordance.
function SmileyIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.9" fill="currentColor" stroke="none" />
      <path d="M8.5 14.5a4 4 0 0 0 7 0" />
    </svg>
  );
}

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
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = counts.reduce((n, c) => n + c.count, 0);

  // Hover intent: open immediately, close after a short grace period so the cursor
  // can travel from the trigger to the palette without it vanishing.
  const openNow = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true); };
  const closeSoon = () => { closeTimer.current = setTimeout(() => setOpen(false), 160); };

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
      <div className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={busy}
          aria-label={mine ? "Change your reaction" : "React"}
          aria-haspopup="true"
          aria-expanded={open}
          className={`inline-flex items-center justify-center rounded-lg p-1.5 transition-colors disabled:opacity-60 ${
            mine
              ? "bg-emerald-50 dark:bg-emerald-500/10"
              : "text-muted hover:bg-elevated hover:text-body"
          }`}
        >
          {mine ? <span className="text-lg leading-none">{mine}</span> : <SmileyIcon />}
        </button>

        {open && (
          <>
            {/* tap-away catcher for touch devices */}
            <div className="fixed inset-0 z-10 sm:hidden" onClick={() => setOpen(false)} aria-hidden />
            <div className="absolute bottom-full left-0 z-20 mb-1 flex gap-0.5 rounded-full bg-surface p-1 shadow-lg ring-1 ring-line">
              {REACTIONS.map((r) => (
                <button
                  key={r.emoji}
                  type="button"
                  title={r.label}
                  aria-label={r.label}
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
