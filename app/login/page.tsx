"use client";
// Login page — username or email + password gate for the dashboard.

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthShell, { authInput, authButton } from "@/components/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernameOrEmail, password }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json();
      setError(data.error ?? "Incorrect username/email or password.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      emoji="🤝"
      title="Networking Cards"
      subtitle="Sign in to manage your profiles"
      footer={
        <div className="flex justify-between">
          <Link href="/signup" className="font-medium text-emerald-700 hover:text-emerald-600 transition-colors">
            Create account
          </Link>
          <Link href="/forgot-password" className="text-slate-400 hover:text-slate-600 transition-colors">
            Forgot password?
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={usernameOrEmail}
          onChange={(e) => setUsernameOrEmail(e.target.value)}
          placeholder="Username or email"
          autoFocus
          autoComplete="username"
          required
          className={authInput}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoComplete="current-password"
          required
          className={authInput}
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" disabled={loading} className={authButton}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}

