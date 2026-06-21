"use client";
// Reusable account-preview modal — a privacy-safe teaser (no contact info / feed /
// QR) fetched from /api/users/[username]/preview. Controlled via `open`. Used by
// "People you may know" (with a Connect action) and pending requests (info only,
// no `id` → no Connect button).
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface PreviewTarget {
  username: string;
  id?: string; // when present, a Connect button is shown
  name: string;
  avatarUrl?: string | null;
}

interface Preview {
  username: string;
  name: string;
  avatarUrl: string | null;
  headline: string | null;
  about: string | null;
  topTopics: string[];
  mutuals: { count: number; names: string[] };
  connectionsCount: number;
  isConnected: boolean;
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} className="h-14 w-14 rounded-full object-cover ring-1 ring-line" />
  ) : (
    <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-lg font-bold text-emerald-700 dark:text-emerald-300">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function AccountPreviewModal({ open, onClose }: { open: PreviewTarget | null; onClose: () => void }) {
  const router = useRouter();
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setPreview(null);
    setLoading(true);
    fetch(`/api/users/${open.username}/preview`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (active) setPreview(d); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open]);

  if (!open) return null;

  async function connect(userId: string) {
    setConnecting(true);
    try {
      const res = await fetch("/api/network/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerUserId: userId }),
      });
      if (res.ok) { onClose(); router.refresh(); }
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-sm rounded-2xl bg-surface shadow-xl ring-1 ring-line overflow-hidden">
        <div className="h-1.5 bg-emerald-500" />
        <button onClick={onClose} className="absolute right-3 top-3 text-muted hover:text-foreground text-lg leading-none" aria-label="Close">✕</button>
        <div className="p-5">
          <div className="flex items-center gap-3">
            <Avatar url={preview?.avatarUrl ?? open.avatarUrl ?? null} name={preview?.name ?? open.name} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{preview?.name ?? open.name}</p>
              <p className="truncate text-xs text-muted">@{open.username}</p>
              {preview?.headline && <p className="mt-0.5 truncate text-sm text-body">{preview.headline}</p>}
            </div>
          </div>

          {loading && <p className="mt-4 text-sm text-muted">Loading preview…</p>}

          {preview && (
            <div className="mt-4 space-y-3 text-sm">
              {preview.mutuals.count > 0 && (
                <p className="text-body">
                  🔗 <span className="font-medium">{preview.mutuals.count} mutual connection{preview.mutuals.count !== 1 ? "s" : ""}</span>
                  {preview.mutuals.names.length > 0 && (
                    <span className="text-muted"> · {preview.mutuals.names.slice(0, 2).join(", ")}{preview.mutuals.count > 2 ? ` +${preview.mutuals.count - 2}` : ""}</span>
                  )}
                </p>
              )}
              {preview.about && <p className="text-body leading-relaxed">{preview.about}</p>}
              {preview.topTopics.length > 0 && (
                <p className="flex flex-wrap items-center gap-1.5">
                  <span className="text-muted text-xs">Talks about</span>
                  {preview.topTopics.map((t) => (
                    <span key={t} className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">#{t}</span>
                  ))}
                </p>
              )}
              <p className="text-xs text-muted">{preview.connectionsCount} connection{preview.connectionsCount !== 1 ? "s" : ""}</p>
            </div>
          )}

          {open.id && (
            <div className="mt-5">
              {preview?.isConnected ? (
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">✓ Already connected</p>
              ) : (
                <button
                  onClick={() => connect(open.id!)}
                  disabled={connecting}
                  className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
                >
                  {connecting ? "Connecting…" : "+ Connect"}
                </button>
              )}
            </div>
          )}
          <p className="mt-2 text-center text-[11px] text-muted">Contact details &amp; posts unlock once you connect.</p>
        </div>
      </div>
    </div>
  );
}
