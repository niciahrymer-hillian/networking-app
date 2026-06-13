"use client";
// Account settings page — currently just change password.
// WHY: Gives the user a safe, in-app way to update their credentials without
//      needing direct DB access.

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  // Account-level identity (name + avatar) — separate from any card.
  const [acctName, setAcctName] = useState("");
  const [acctAvatar, setAcctAvatar] = useState<string | null>(null);
  const [idSaving, setIdSaving] = useState(false);
  const [idSaved, setIdSaved] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [resetError, setResetError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    fetch("/api/account").then((r) => r.json()).then((d) => {
      setAcctName(d?.name ?? "");
      setAcctAvatar(d?.avatarUrl ?? null);
    }).catch(() => {});
  }, []);

  async function saveIdentity(e: React.FormEvent) {
    e.preventDefault();
    setIdSaving(true);
    setIdSaved(false);
    try {
      await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: acctName, avatarUrl: acctAvatar ?? "" }),
      });
      setIdSaved(true);
      router.refresh();
    } finally {
      setIdSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok && data.url) setAcctAvatar(data.url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
      } else {
        setSuccess(true);
        setCurrent("");
        setNext("");
        setConfirm("");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResetClick() {
    setResetError("");
    setResetUrl("");
    setResetLoading(true);

    try {
      const res = await fetch("/api/auth/account-reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error ?? "Unable to generate reset link.");
      } else {
        setResetUrl(data.resetUrl);
      }
    } finally {
      setResetLoading(false);
    }
  }

  const input =
    "w-full bg-surface border border-line-strong rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition";

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Account Settings</h1>
          <p className="text-sm text-muted">Update your identity, change your password, or generate a reset link.</p>
        </div>

        {/* Account-level identity (separate from any card) */}
        <form onSubmit={saveIdentity} className="bg-surface ring-1 ring-line shadow-sm rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Your identity</h2>
            <p className="text-sm text-muted mt-1">Your account name + photo — how you appear in the feed, messages, and your profile. Your individual cards can still have their own names.</p>
          </div>
          <div className="flex items-center gap-4">
            {acctAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={acctAvatar} alt="" className="h-16 w-16 rounded-full object-cover ring-1 ring-line" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {(acctName || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <button type="button" onClick={() => avatarRef.current?.click()} className="text-sm border border-line-strong bg-surface hover:bg-elevated text-body px-4 py-2 rounded-lg transition-colors">
              Upload photo
            </button>
            <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Display name</label>
            <input value={acctName} onChange={(e) => setAcctName(e.target.value)} placeholder="e.g. Ava Chen" className={input} />
          </div>
          {idSaved && <p className="text-emerald-700 dark:text-emerald-300 text-sm">Identity saved.</p>}
          <button type="submit" disabled={idSaving} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
            {idSaving ? "Saving…" : "Save identity"}
          </button>
        </form>

        <form onSubmit={handleSubmit} className="bg-surface ring-1 ring-line shadow-sm rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Change Password</h2>

          {success && (
            <p className="text-emerald-700 dark:text-emerald-300 text-sm bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg px-3 py-2">
              Password updated successfully.
            </p>
          )}
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted mb-1">Current password</label>
              <input
                type="password"
                value={current}
                onChange={e => setCurrent(e.target.value)}
                required
                autoComplete="current-password"
                className={input}
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">New password</label>
              <input
                type="password"
                value={next}
                onChange={e => setNext(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className={input}
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className={input}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
            >
              {loading ? "Saving…" : "Update password"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-4 py-2 text-sm text-muted hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        <section className="bg-surface ring-1 ring-line shadow-sm rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">Reset Password</h2>
              <p className="text-sm text-muted">Generate a one-time reset link if you don’t remember your current password.</p>
            </div>
            <button
              type="button"
              onClick={handleResetClick}
              disabled={resetLoading}
              className="border border-line-strong bg-surface hover:bg-elevated disabled:opacity-50 text-body text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              {resetLoading ? "Generating…" : "Generate reset link"}
            </button>
          </div>

          {resetError && (
            <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg px-3 py-2">
              {resetError}
            </p>
          )}

          {resetUrl && (
            <div className="space-y-2">
              <p className="text-emerald-700 dark:text-emerald-300 text-sm">Reset link created. It expires in 1 hour.</p>
              <a
                href={resetUrl}
                className="block break-all text-emerald-700 dark:text-emerald-300 hover:text-emerald-600 text-sm"
              >
                {resetUrl}
              </a>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
