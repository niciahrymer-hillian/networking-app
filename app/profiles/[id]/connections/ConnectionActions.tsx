"use client";
// Confirm / Decline buttons for a pending connection request.
// WHY: The connections page is a server component; this isolates the small bit of
//      client interactivity (PATCH + refresh) for acting on a request.
// EFFECT: PATCHes /api/connections/[id], then refreshes the page so the row moves
//         out of the requests inbox (confirmed -> network, declined -> hidden).

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ConnectionActions({ id }: { id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function decide(status: "confirmed" | "declined") {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/connections/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const { error: apiErr } = await res.json().catch(() => ({}));
        throw new Error(apiErr ?? "Something went wrong");
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false); // leave buttons usable to retry; on success the row unmounts
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {error && <span className="text-xs text-red-600 mr-1">{error}</span>}
      <button
        onClick={() => decide("confirmed")}
        disabled={busy}
        className="text-xs font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition-colors"
      >
        Confirm
      </button>
      <button
        onClick={() => decide("declined")}
        disabled={busy}
        className="text-xs font-medium bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-600 px-3 py-1.5 rounded-lg transition-colors"
      >
        Decline
      </button>
    </div>
  );
}
