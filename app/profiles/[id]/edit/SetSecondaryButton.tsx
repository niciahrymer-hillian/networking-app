"use client";
// SetSecondaryButton — lets the user link this profile as a secondary card of another.
// WHY: Someone with two careers can associate both cards so visitors see both QR codes.
// EFFECT: Calls PATCH /api/profiles/[id]/set-parent. Parent page refreshes after change.

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OtherProfile {
  id: string;
  name: string;
  headline: string | null;
}

interface Props {
  id: string;                      // current profile's ID
  parentProfileId: string | null;  // already linked parent, or null
  parentName: string | null;       // name of parent for display
  otherProfiles: OtherProfile[];   // all other profiles the user can link to
}

export default function SetSecondaryButton({ id, parentProfileId, parentName, otherProfiles }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function setParent(newParentId: string | null) {
    setBusy(true);
    setError("");
    const res = await fetch(`/api/profiles/${id}/set-parent`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentProfileId: newParentId }),
    });
    setBusy(false);
    if (!res.ok) {
      const { error: e } = await res.json();
      setError(e ?? "Something went wrong");
    } else {
      router.refresh();
    }
  }

  return (
    <div className="mt-6 pt-6 border-t border-slate-100">
      <p className="text-sm font-medium text-slate-600 mb-2">Secondary card</p>
      <p className="text-xs text-slate-500 mb-4">
        If you have two careers, link this card to a primary card. Both will reference each other on the public page.
      </p>

      {parentProfileId ? (
        // Currently linked — show parent name + unlink button
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
            ✦ Secondary of: <strong>{parentName}</strong>
          </span>
          <button
            disabled={busy}
            onClick={() => setParent(null)}
            className="text-xs text-slate-500 hover:text-slate-800 disabled:opacity-50 transition-colors"
          >
            {busy ? "Unlinking…" : "Unlink"}
          </button>
        </div>
      ) : otherProfiles.length === 0 ? (
        <p className="text-xs text-slate-400 italic">Add another profile first to link cards together.</p>
      ) : (
        // No parent — show dropdown to pick one
        <div className="flex items-center gap-3 flex-wrap">
          <select
            disabled={busy}
            defaultValue=""
            onChange={(e) => e.target.value && setParent(e.target.value)}
            className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          >
            <option value="" disabled>
              Link as secondary of…
            </option>
            {otherProfiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.headline ? ` — ${p.headline}` : ""}
              </option>
            ))}
          </select>
          {busy && <span className="text-xs text-slate-500">Saving…</span>}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
