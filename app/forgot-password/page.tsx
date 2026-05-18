"use client";
// Forgot password — generates a one-time reset token shown on screen.
// WHY: No email is configured. User proves server access via the ADMIN_PASSWORD
//      env var (the "recovery key") — only someone who deployed the app knows it.

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, recoveryKey }),
    });

    const data = await res.json();
    if (res.ok && data.token) {
      setToken(data.token);
    } else if (res.ok) {
      // Generic message (username not found but we don't reveal that)
      setToken("not-found");
    } else {
      setError(data.error ?? "Request failed.");
    }
    setLoading(false);
  }

  if (token && token !== "not-found") {
    return (
      <main className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6">
            <p className="text-4xl mb-3">🔑</p>
            <h1 className="text-2xl font-bold text-white">Reset token ready</h1>
            <p className="text-white/40 text-sm mt-1">Use this link to set a new password. Expires in 1 hour.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <Link
              href={`/reset-password/${token}`}
              className="block w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Set new password →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (token === "not-found") {
    return (
      <main className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-white/60">If that account exists, a reset token was generated.</p>
          <Link href="/login" className="mt-4 inline-block text-indigo-400 hover:text-indigo-300 text-sm">
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">🔒</p>
          <h1 className="text-2xl font-bold text-white">Forgot password</h1>
          <p className="text-white/40 text-sm mt-1 leading-relaxed">
            Enter your username and the <strong className="text-white/60">ADMIN_PASSWORD</strong> from your
            server environment as the recovery key.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4"
        >
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            autoFocus
            required
            className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <input
            type="password"
            value={recoveryKey}
            onChange={(e) => setRecoveryKey(e.target.value)}
            placeholder="Recovery key (ADMIN_PASSWORD)"
            required
            className="w-full bg-white/10 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500 transition-colors"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? "Checking…" : "Get reset link"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          <Link href="/login" className="text-white/40 hover:text-white/60 transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
