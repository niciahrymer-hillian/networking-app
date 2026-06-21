"use client";
// A "Preview" button that opens the shared account-preview modal for a username.
// Used on pending connection requests when the requester turns out to have an account
// (resolved server-side via emailHash). Info-only: no `id`, so no Connect button.
import { useState } from "react";
import AccountPreviewModal, { type PreviewTarget } from "@/components/AccountPreviewModal";

export default function AccountPreviewButton({
  username, name, avatarUrl, className = "",
}: {
  username: string;
  name: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const target: PreviewTarget = { username, name, avatarUrl };
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline ${className}`}
      >
        Preview
      </button>
      <AccountPreviewModal open={open ? target : null} onClose={() => setOpen(false)} />
    </>
  );
}
