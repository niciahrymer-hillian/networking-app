"use client";
// Compose box for the feed — posts to /api/posts then refreshes the server feed.

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Composer() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    });
    if (res.ok) {
      setContent("");
      router.refresh();
    } else {
      const { error: e2 } = await res.json().catch(() => ({}));
      setError(e2 ?? "Couldn't post");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="bg-white ring-1 ring-emerald-900/5 shadow-sm rounded-2xl p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={2000}
        placeholder="Share an update with your network…"
        className="w-full resize-none bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={busy || !content.trim()}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {busy ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
