"use client";
// Button on the edit page to designate this profile as the owner's personal card.
// WHY: Lets the admin mark "this is MY card" so the dashboard can surface it prominently.
// EFFECT: Calls PATCH /api/profiles/[id]/set-owner then refreshes the page.

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  id: string;
  isOwner: boolean;
}

export default function SetOwnerButton({ id, isOwner }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (isOwner) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
        ✦ My card
      </span>
    );
  }

  async function handleClick() {
    setLoading(true);
    await fetch(`/api/profiles/${id}/set-owner`, { method: "PATCH" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs text-slate-500 hover:text-slate-800 border border-slate-300 hover:border-slate-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
    >
      {loading ? "Setting…" : "Set as my card"}
    </button>
  );
}
