"use client";
// Forgot password — generates a reset token for username or email.

import { useState } from "react";
import Link from "next/link";
import AuthShell, { authInput, authButton } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernameOrEmail }),
    });

    const data = await res.json();
    if (res.ok && data.token) {
      setToken(data.token);
      setEmail(data.email ?? null);
    } else if (res.ok) {
      setToken("not-found");
    } else {
      setError(data.error ?? "Request failed.");
    }
    setLoading(false);
  }

  if (token && token !== "not-found") {
    return (
      <AuthShell
        emoji="🔑"
        title="Reset token ready"
        subtitle="Use this link to set a new password. Expires in 1 hour."
        footer={
          email
            ? `A reset link was generated for ${email}. If email delivery is configured, check your inbox.`
            : "If email is not configured, use the direct link above."
        }
      >
        <Link
          href={`/reset-password/${token}`}
          className="block w-full text-center bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Set new password →
        </Link>
      </AuthShell>
    );
  }

  if (token === "not-found") {
    return (
      <AuthShell
        emoji="📭"
        title="Check your account"
        footer={
          <Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-600 transition-colors">
            Back to sign in
          </Link>
        }
      >
        <p className="text-center text-slate-600 text-sm">
          If that account exists, a reset token was generated.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      emoji="🔒"
      title="Forgot password"
      subtitle="Enter the username or email for your account. A password reset link will be generated."
      footer={
        <Link href="/login" className="text-slate-400 hover:text-slate-600 transition-colors">
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
          placeholder="Username or email"
          autoFocus
          required
          className={authInput}
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" disabled={loading} className={authButton}>
          {loading ? "Checking…" : "Generate reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
