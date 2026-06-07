"use client";
// Delete profile button — confirms before deleting then refreshes the page.

import { useRouter } from "next/navigation";

export default function DeleteButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Delete profile for "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/profiles/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      className="text-xs bg-red-50 dark:bg-red-500/10 hover:bg-red-100 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 px-3 py-1.5 rounded-lg transition-colors"
    >
      Delete
    </button>
  );
}
