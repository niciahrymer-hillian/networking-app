"use client";
// Rich compose box — caption (markdown), one media attachment (image/audio/video),
// an optional link (YouTube auto-embeds in the feed), and hashtags.

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function parseTags(s: string): string[] {
  return Array.from(
    new Set(
      s
        .split(/[\s,]+/)
        .map((t) => t.replace(/^#/, "").trim().toLowerCase())
        .filter(Boolean)
    )
  ).slice(0, 10);
}

export default function Composer() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [media, setMedia] = useState<{ url: string; type: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File) {
    const kind = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("audio/")
      ? "audio"
      : file.type.startsWith("video/")
      ? "video"
      : null;
    if (!kind) return setError("Unsupported file type.");
    setUploading(true);
    setError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = await res.json();
      setMedia({ url, type: kind, name: file.name });
    } else {
      const { error: e } = await res.json().catch(() => ({}));
      setError(e ?? "Upload failed (large videos exceed the limit).");
    }
    setUploading(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = content.trim();
    if (!text && !media && !link.trim()) return;
    setBusy(true);
    setError("");
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: text,
        mediaUrl: media?.url,
        mediaType: media?.type,
        linkUrl: link.trim() || undefined,
        tags: parseTags(tagsInput),
      }),
    });
    if (res.ok) {
      setContent("");
      setLink("");
      setTagsInput("");
      setMedia(null);
      router.refresh();
    } else {
      const { error: e } = await res.json().catch(() => ({}));
      setError(e ?? "Couldn't post");
    }
    setBusy(false);
  }

  const field = "w-full bg-surface border border-line rounded-xl px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <form onSubmit={submit} className="bg-surface ring-1 ring-line shadow-sm rounded-2xl p-4 space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        maxLength={5000}
        placeholder="Share an update… (markdown + #hashtags welcome)"
        className={`${field} resize-none`}
      />

      {media && (
        <div className="flex items-center justify-between bg-elevated rounded-lg px-3 py-2 text-xs text-body">
          <span className="truncate">📎 {media.type}: {media.name}</span>
          <button type="button" onClick={() => setMedia(null)} className="text-muted hover:text-red-500 ml-2">✕</button>
        </div>
      )}

      <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link or YouTube URL (optional)" className={field} />
      <input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="Tags (e.g. design networking)" className={field} />

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-sm text-muted hover:text-emerald-700 transition-colors"
        >
          {uploading ? "Uploading…" : "📷 Add media"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,audio/*,video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
        <button
          type="submit"
          disabled={busy || uploading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {busy ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
