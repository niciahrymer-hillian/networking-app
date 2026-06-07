"use client";

import { useMemo, useState } from "react";

type User = {
  id: string;
  username: string;
  email: string | null;
  emailVerified: boolean;
  isAdmin: boolean;
  createdAt: Date;
};

export default function AdminUserManagement({ users }: { users: User[] }) {
  const [passwords, setPasswords] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.username.localeCompare(b.username)),
    [users]
  );

  async function resetUserPassword(userId: string) {
    const newPassword = passwords[userId]?.trim();
    if (!newPassword || newPassword.length < 8) {
      setStatus((prev) => ({ ...prev, [userId]: "Enter a new password with at least 8 characters." }));
      return;
    }

    setLoading((prev) => ({ ...prev, [userId]: true }));
    setStatus((prev) => ({ ...prev, [userId]: "" }));

    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus((prev) => ({ ...prev, [userId]: data.error ?? "Unable to reset password." }));
      } else {
        setStatus((prev) => ({ ...prev, [userId]: "Password reset successfully." }));
        setPasswords((prev) => ({ ...prev, [userId]: "" }));
      }
    } catch (error) {
      setStatus((prev) => ({ ...prev, [userId]: "Unable to reset password." }));
    } finally {
      setLoading((prev) => ({ ...prev, [userId]: false }));
    }
  }

  return (
    <div className="space-y-4">
      {sortedUsers.map((user) => (
        <div key={user.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-900">{user.username}</p>
              <p className="text-xs text-slate-500">
                {user.email ?? "No email"} · {user.isAdmin ? "Admin" : "User"} · {user.emailVerified ? "Verified" : "Unverified"}
              </p>
            </div>
            <p className="text-xs text-slate-400">Created {new Date(user.createdAt).toLocaleString()}</p>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="password"
              value={passwords[user.id] || ""}
              onChange={(e) => setPasswords((prev) => ({ ...prev, [user.id]: e.target.value }))}
              placeholder="New password"
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => resetUserPassword(user.id)}
              disabled={loading[user.id]}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold px-4 py-3 rounded-lg transition-colors"
            >
              {loading[user.id] ? "Resetting…" : "Reset password"}
            </button>
          </div>

          {status[user.id] && (
            <p className="mt-3 text-sm text-slate-600">{status[user.id]}</p>
          )}
        </div>
      ))}
    </div>
  );
}
