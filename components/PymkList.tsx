"use client";
// "People you may know" rows + a click-to-open account-preview modal (shared
// AccountPreviewModal). The preview is a privacy-safe teaser — just enough to decide
// whether to connect.
import { useState } from "react";
import { useRouter } from "next/navigation";
import AccountPreviewModal, { type PreviewTarget } from "@/components/AccountPreviewModal";

export interface PymkPerson {
  id: string;
  username: string;
  name: string;
  headshotUrl: string | null;
  mutuals: number;
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={name} className="h-9 w-9 rounded-full object-cover ring-1 ring-line" />
  ) : (
    <div className="grid h-9 w-9 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-sm font-bold text-emerald-700 dark:text-emerald-300">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function PymkList({ people }: { people: PymkPerson[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<PreviewTarget | null>(null);
  const [connecting, setConnecting] = useState(false);

  async function connect(userId: string) {
    setConnecting(true);
    try {
      const res = await fetch("/api/network/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerUserId: userId }),
      });
      if (res.ok) router.refresh();
    } finally {
      setConnecting(false);
    }
  }

  return (
    <>
      <ul className="flex flex-col gap-3">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-3">
            <button
              onClick={() => setOpen({ username: p.username, id: p.id, name: p.name, avatarUrl: p.headshotUrl })}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
              title="Preview"
            >
              <Avatar url={p.headshotUrl} name={p.name} />
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
      <AccountPreviewModal open={open} onClose={() => setOpen(null)} />
    </>
  );
}
