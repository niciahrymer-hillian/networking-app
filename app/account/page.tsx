"use client";
// Account settings page — currently just change password.
// WHY: Gives the user a safe, in-app way to update their credentials without
//      needing direct DB access.

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccountPage() {
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [resetError, setResetError] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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
    "w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition";

  return (
    <main className="min-h-screen bg-[#f6fbf8] text-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Account Settings</h1>
          <p className="text-sm text-slate-500">Change your password or generate a reset link if you don’t know your current password.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white ring-1 ring-emerald-900/5 shadow-sm rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Change Password</h2>

          {success && (
            <p className="text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              Password updated successfully.
            </p>
          )}
          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Current password</label>
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
              <label className="block text-xs text-slate-500 mb-1">New password</label>
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
              <label className="block text-xs text-slate-500 mb-1">Confirm new password</label>
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
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        <section className="bg-white ring-1 ring-emerald-900/5 shadow-sm rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Reset Password</h2>
              <p className="text-sm text-slate-500">Generate a one-time reset link if you don’t remember your current password.</p>
            </div>
            <button
              type="button"
              onClick={handleResetClick}
              disabled={resetLoading}
              className="border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors shrink-0"
            >
              {resetLoading ? "Generating…" : "Generate reset link"}
            </button>
          </div>

          {resetError && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {resetError}
            </p>
          )}

          {resetUrl && (
            <div className="space-y-2">
              <p className="text-emerald-700 text-sm">Reset link created. It expires in 1 hour.</p>
              <a
                href={resetUrl}
                className="block break-all text-emerald-700 hover:text-emerald-600 text-sm"
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
