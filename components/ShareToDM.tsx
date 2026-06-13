"use client";
// "Send" a feed post into a direct message: opens a connection picker, creates
// (or reuses) a DM, and posts the shared post into it.

import { useState } from "react";
import Link from "next/link";

type Person = { id: string; username: string; name: string | null; headshotUrl: string | null };

export default function ShareToDM({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [connections, setConnections] = useState<Person[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function openModal() {
    setOpen(true);
    setSentTo(null);
    if (!loaded) {
      const r = await fetch("/api/network").then((x) => x.json()).catch(() => null);
      setConnections(r?.connections ?? []);
      setLoaded(true);
    }
  }

  async function sendTo(c: Person) {
    if (busy) return;
    setBusy(true);
    try {
      const conv = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [c.id] }),
      }).then((x) => x.json());
      if (conv?.id) {
        await fetch(`/api/conversations/${conv.id}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sharedPostId: postId }),
        });
        setSentTo(c.name ?? `@${c.username}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium text-muted transition-colors hover:bg-elevated hover:text-body"
      >
        ↗ Send
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-surface p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <p className="mb-3 font-semibold">Send post to…</p>
            {sentTo ? (
              <div className="py-4 text-center text-sm">
                <p className="text-body">Sent to <span className="font-semibold">{sentTo}</span> ✓</p>
                <Link href="/messages" className="mt-2 inline-block text-emerald-700 dark:text-emerald-300 hover:underline">Open Messages →</Link>
              </div>
            ) : (
              <div className="max-h-72 space-y-1 overflow-y-auto">
                {!loaded ? (
                  <p className="text-sm text-muted">Loading…</p>
                ) : connections.length === 0 ? (
                  <p className="text-sm text-muted">No connections yet — connect with people to share posts with them.</p>
                ) : connections.map((c) => (
                  <button key={c.id} onClick={() => sendTo(c)} disabled={busy} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-elevated disabled:opacity-50">
                    {c.headshotUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.headshotUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-1 ring-line" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        {(c.name ?? c.username).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm">{c.name ?? `@${c.username}`}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="mt-3 text-right">
              <button onClick={() => setOpen(false)} className="px-3 py-1.5 text-sm text-muted">Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
