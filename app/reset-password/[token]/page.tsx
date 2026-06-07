"use client";
// Reset password — set a new password using the token from the forgot-password flow.

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { authInput, authButton } from "@/components/AuthShell";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    // Unwrap params — Next.js 16 passes them as a Promise
    const { token } = await params;
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json();
      setError(data.error ?? "Reset failed.");
      setLoading(false);
    }
  }

  return (
    <AuthShell emoji="🔑" title="Set new password">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password (min 8 chars)"
          autoFocus
          autoComplete="new-password"
          required
          className={authInput}
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm new password"
          autoComplete="new-password"
          required
          className={authInput}
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" disabled={loading} className={authButton}>
          {loading ? "Saving…" : "Set password"}
        </button>
      </form>
    </AuthShell>
  );
}
