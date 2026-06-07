"use client";
// Forgot password — generates a reset token for username or email.

import { useState } from "react";
import Link from "next/link";
import AuthShell, { authInput, authButton } from "@/components/AuthShell";

export default function ForgotPasswordPage() {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [token, setToken] = useState(""); // dev only — direct link without email
  const [sent, setSent] = useState(false);
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
      // Development: the API returns the token so we can link directly.
      setToken(data.token);
      setEmail(data.email ?? null);
    } else if (res.ok) {
      // Production: the link was emailed (same message whether or not the
      // account exists, so we never reveal which usernames/emails are real).
      setSent(true);
    } else {
      setError(data.error ?? "Request failed.");
    }
    setLoading(false);
  }

  if (token && token !== "not-found") {
    return (
      <AuthShell
        emoji="🔑"
        title="Reset link ready (dev)"
        subtitle="Use this link to set a new password. Expires in 1 hour."
        footer={email ? `In production this link is emailed to ${email}.` : undefined}
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

  if (sent) {
    return (
      <AuthShell
        emoji="📬"
        title="Check your email"
        footer={
          <Link href="/login" className="font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-600 transition-colors">
            Back to sign in
          </Link>
        }
      >
        <p className="text-center text-body text-sm">
          If an account matches, we&apos;ve sent a password reset link. It expires in 1 hour —
          check your inbox (and spam folder).
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      emoji="🔒"
      title="Forgot password"
      subtitle="Enter your username or email and we'll send a password reset link to your inbox."
      footer={
        <Link href="/login" className="text-muted hover:text-body transition-colors">
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

        {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

        <button type="submit" disabled={loading} className={authButton}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
