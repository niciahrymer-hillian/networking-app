"use client";
// Toggle on the edit page: "Let my connections share this card's QR".
// WHY: Per-card privacy control. When on, people in the owner's network see a
//      "Share QR" button on the owner's member profile (/u/[username]).
// EFFECT: PATCH /api/profiles/[id]/share-qr then refreshes the page.

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  id: string;
  allowed: boolean;
}

export default function ShareToggle({ id, allowed }: Props) {
  const router = useRouter();
  const [on, setOn] = useState(allowed);
  const [saving, setSaving] = useState(false);

  async function toggle() {
    const next = !on;
    setSaving(true);
    setOn(next); // optimistic
    const res = await fetch(`/api/profiles/${id}/share-qr`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allow: next }),
    });
    if (!res.ok) setOn(!next); // revert on failure
    else router.refresh();
    setSaving(false);
  }

  return (
    <label className="mt-5 flex items-start gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={saving}
        onClick={toggle}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          on ? "bg-emerald-500" : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
      <span className="text-sm">
        <span className="font-medium text-slate-700">Let my connections share this QR</span>
        <span className="block text-xs text-slate-500">
          When on, people in your network can share this card&apos;s QR from your profile.
        </span>
      </span>
    </label>
  );
}
