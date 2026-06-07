"use client";
// Sign up page — create a new account and get signed straight in.

import { useState } from "react";
import Link from "next/link";
import AuthShell, { authInput, authButton } from "@/components/AuthShell";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
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
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (res.ok) {
      // Account created and signed in by the API — onboard straight into creating
      // their first card. Hard navigation (not router.push) so the browser sends
      // the new session cookie on a fresh request instead of serving the stale,
      // logged-out App Router cache (which bounced the user back to signup).
      window.location.assign("/profiles/new");
      return;
    }

    const data = await res.json();
    setError(data.error ?? "Sign up failed.");
    setLoading(false);
  }

  return (
    <AuthShell
      emoji="🤝"
      title="Create account"
      subtitle="Get your own networking card in seconds."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-700 hover:text-emerald-600 transition-colors">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username (min 3 chars)"
          autoFocus
          autoComplete="username"
          required
          className={authInput}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          autoComplete="email"
          required
          className={authInput}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password (min 8 chars)"
          autoComplete="new-password"
          required
          className={authInput}
        />
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm password"
          autoComplete="new-password"
          required
          className={authInput}
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" disabled={loading} className={authButton}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
