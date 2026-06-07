"use client";
// Account-aware connect flow shown on a scanned public card.
// - Owner viewing own card  → a small note.
// - Logged-in visitor       → one-tap mutual network connect (feed link).
// - Logged-out visitor      → account-first: Create account / Sign in (both link
//                             you into the owner's network), or a "Just contact"
//                             fallback that leaves contact info without an account.
//   New sign-ups land on the card designer afterwards (skippable there).

import { useState, useRef } from "react";
import Link from "next/link";

interface Props {
  profileId: string;
  profileName: string;
  ownerUserId?: string | null;
  viewerLoggedIn?: boolean;
  viewerIsOwner?: boolean;
}

const inputCls =
  "w-full bg-surface border border-line-strong rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition";
const labelCls = "block text-sm font-medium text-body mb-1";
const btnPrimary =
  "w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors";

export default function ConnectForm({ profileId, profileName, ownerUserId, viewerLoggedIn, viewerIsOwner }: Props) {
  if (viewerIsOwner) {
    return <p className="text-sm text-muted italic">This is your card — share it to grow your network.</p>;
  }
  if (viewerLoggedIn && ownerUserId) {
    return <NetworkConnect ownerUserId={ownerUserId} name={profileName} />;
  }
  return <GuestConnect profileId={profileId} profileName={profileName} ownerUserId={ownerUserId ?? null} />;
}

async function linkNetwork(ownerUserId: string | null) {
  if (!ownerUserId) return;
  await fetch("/api/network/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerUserId }),
  }).catch(() => {});
}

// --- Logged-in: one-tap mutual connect ---
function NetworkConnect({ ownerUserId, name }: { ownerUserId: string; name: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  async function connect() {
    setState("loading");
    setError("");
    const res = await fetch("/api/network/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerUserId }),
    });
    if (res.ok) setState("done");
    else {
      const { error: e } = await res.json().catch(() => ({}));
      setError(e ?? "Something went wrong");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="text-center py-2">
        <div className="text-4xl mb-2">🤝</div>
        <p className="font-semibold text-foreground">You&apos;re connected with {name}!</p>
        <p className="text-sm text-muted mt-1 mb-4">You&apos;ll see each other&apos;s posts in your feed.</p>
        <Link href="/feed" className="inline-block text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-600">
          View your feed →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted mb-4">Add {name} to your network — you&apos;ll see each other&apos;s posts in your feed.</p>
      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-2">{error}</p>}
      <button onClick={connect} disabled={state === "loading"} className={btnPrimary}>
        {state === "loading" ? "Connecting…" : `＋ Connect with ${name}`}
      </button>
    </div>
  );
}

// --- Logged-out: account-first with a contact fallback ---
function GuestConnect({ profileId, profileName, ownerUserId }: { profileId: string; profileName: string; ownerUserId: string | null }) {
  const [mode, setMode] = useState<"create" | "signin" | "contact">("create");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doneContact, setDoneContact] = useState(false);

  // account create
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  // sign in
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [signinPw, setSigninPw] = useState("");
  // contact
  const [cEmail, setCEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [cardFile, setCardFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!username || !email || !password) return setError("Username, email and password are required.");
    if (password !== confirm) return setError("Passwords don't match.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setBusy(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) {
      const { error: e2 } = await res.json().catch(() => ({}));
      setError(e2 ?? "Sign up failed.");
      setBusy(false);
      return;
    }
    await linkNetwork(ownerUserId);
    // New user → straight into the card designer (skippable via its Dashboard link).
    window.location.assign("/profiles/new");
  }

  async function handleSignin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernameOrEmail, password: signinPw }),
    });
    if (!res.ok) {
      const { error: e2 } = await res.json().catch(() => ({}));
      setError(e2 ?? "Sign in failed.");
      setBusy(false);
      return;
    }
    await linkNetwork(ownerUserId);
    window.location.assign("/feed");
  }

  async function handleContact(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!cEmail && !linkedin && !github && !cardFile) return setError("Please provide at least one way to connect.");
    setBusy(true);
    try {
      let cardFilename: string | undefined;
      if (cardFile) {
        const fd = new FormData();
        fd.append("file", cardFile);
        const up = await fetch("/api/private-upload", { method: "POST", body: fd });
        if (!up.ok) {
          const { error: e2 } = await up.json();
          throw new Error(e2 ?? "Photo upload failed");
        }
        ({ filename: cardFilename } = await up.json());
      }
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          email: cEmail.trim() || undefined,
          linkedin: linkedin.trim() || undefined,
          github: github.trim() || undefined,
          cardFilename,
        }),
      });
      if (!res.ok) {
        const { error: e2 } = await res.json();
        throw new Error(e2 ?? "Something went wrong");
      }
      setDoneContact(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (doneContact) {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-2">🎉</div>
        <p className="font-semibold text-foreground">Request sent!</p>
        <p className="text-sm text-muted mt-1">{profileName} will confirm the connection. Great meeting you!</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-muted mb-4">
        Connect with {profileName} — create an account (or sign in) to follow each other&apos;s posts, or just leave your contact.
      </p>

      <div className="flex gap-1 mb-4 bg-elevated rounded-xl p-1 text-sm">
        {(["create", "signin", "contact"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); setError(""); }}
            className={`flex-1 py-1.5 rounded-lg transition-colors ${
              mode === m ? "bg-surface shadow-sm font-medium text-foreground" : "text-muted hover:text-body"
            }`}
          >
            {m === "create" ? "Create account" : m === "signin" ? "Sign in" : "Just contact"}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>}

      {mode === "create" && (
        <form onSubmit={handleCreate} className="space-y-3">
          <input className={inputCls} placeholder="Username" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <input className={inputCls} type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className={inputCls} type="password" placeholder="Password (min 8)" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <input className={inputCls} type="password" placeholder="Confirm password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Creating…" : `Create account & connect`}</button>
        </form>
      )}

      {mode === "signin" && (
        <form onSubmit={handleSignin} className="space-y-3">
          <input className={inputCls} placeholder="Username or email" autoComplete="username" value={usernameOrEmail} onChange={(e) => setUsernameOrEmail(e.target.value)} />
          <input className={inputCls} type="password" placeholder="Password" autoComplete="current-password" value={signinPw} onChange={(e) => setSigninPw(e.target.value)} />
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Signing in…" : `Sign in & connect`}</button>
        </form>
      )}

      {mode === "contact" && (
        <form onSubmit={handleContact} className="space-y-3">
          <div>
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" placeholder="you@example.com" value={cEmail} onChange={(e) => setCEmail(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>LinkedIn</label>
            <input className={inputCls} placeholder="linkedin.com/in/you" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>GitHub</label>
            <input className={inputCls} placeholder="github.com/you" value={github} onChange={(e) => setGithub(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Business card photo</label>
            {/* eslint-disable-next-line react/no-unknown-property */}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={(e) => setCardFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-muted file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
          </div>
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? "Sending…" : "Send contact"}</button>
        </form>
      )}
    </div>
  );
}
