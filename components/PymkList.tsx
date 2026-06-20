"use client";
// "People you may know" rows + a click-to-open account-preview modal.
// The preview is a privacy-safe teaser (no contact info / feed / QR) fetched from
// /api/users/[username]/preview — just enough to decide whether to connect.
import { useState } from "react";
import { useRouter } from "next/navigation";

export interface PymkPerson {
  id: string;
  username: string;
  name: string;
  headshotUrl: string | null;
  mutuals: number;
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

function Avatar({ url, name, size }: { url: string | null; name: string; size: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} className={`${size} rounded-full object-cover ring-1 ring-line`} />
  ) : (
    <div className={`${size} grid place-items-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 font-bold text-emerald-700 dark:text-emerald-300`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function PymkList({ people }: { people: PymkPerson[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<PymkPerson | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);

  async function openPreview(p: PymkPerson) {
    setOpen(p);
    setPreview(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${p.username}/preview`);
      if (res.ok) setPreview(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function connect(userId: string) {
    setConnecting(true);
    try {
      const res = await fetch("/api/network/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerUserId: userId }),
      });
      if (res.ok) {
        setOpen(null);
        router.refresh(); // they drop off PYMK and into your network
      }
    } finally {
      setConnecting(false);
    }
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-3">
            <button onClick={() => openPreview(p)} className="flex min-w-0 flex-1 items-center gap-3 text-left" title="Preview">
              <Avatar url={p.headshotUrl} name={p.name} size="h-9 w-9 text-sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium hover:underline">{p.name}</span>
                <span className="block truncate text-xs text-muted">{p.mutuals} mutual connection{p.mutuals !== 1 ? "s" : ""}</span>
              </span>
            </button>
            <button
              onClick={() => connect(p.id)}
              disabled={connecting}
              className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
            >
              + Connect
            </button>
          </li>
        ))}
      </ul>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(null)} aria-hidden />
          <div className="relative w-full max-w-sm rounded-2xl bg-surface shadow-xl ring-1 ring-line overflow-hidden">
            <div className="h-1.5 bg-emerald-500" />
            <button onClick={() => setOpen(null)} className="absolute right-3 top-3 text-muted hover:text-foreground text-lg leading-none" aria-label="Close">✕</button>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <Avatar url={preview?.avatarUrl ?? open.headshotUrl} name={preview?.name ?? open.name} size="h-14 w-14 text-lg" />
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

              <div className="mt-5">
                {preview?.isConnected ? (
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">✓ Already connected</p>
                ) : (
                  <button
                    onClick={() => connect(open.id)}
                    disabled={connecting}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
                  >
                    {connecting ? "Connecting…" : "+ Connect"}
                  </button>
                )}
              </div>
              <p className="mt-2 text-center text-[11px] text-muted">Contact details & posts unlock once you connect.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
