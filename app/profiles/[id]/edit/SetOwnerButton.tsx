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
      <span className="flex items-center gap-1.5 text-xs font-medium text-indigo-400 bg-indigo-900/40 border border-indigo-500/30 px-3 py-1.5 rounded-lg">
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
      className="text-xs text-white/40 hover:text-white/70 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
    >
      {loading ? "Setting…" : "Set as my card"}
    </button>
  );
}
