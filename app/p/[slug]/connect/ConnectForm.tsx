"use client";
// /p/[slug]/connect — Public connection capture + optional account creation.
// WHY: Shown to someone who just scanned a profile QR code.
//      Lets them share contact info AND optionally create their own account
//      so they can manage their own networking card.
// EFFECT: POSTs to /api/connections, then optionally /api/auth/signup.

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props {
  profileId: string;
  profileName: string;
  dark?: boolean; // true when rendered on the dark public profile page
}

export default function ConnectForm({ profileId, profileName, dark = false }: Props) {
  const router = useRouter();
  // Derive Tailwind class fragments from the dark/light context
  const label = dark ? "text-white/70" : "text-gray-700";
  const input = dark
    ? "bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:ring-indigo-400"
    : "border-gray-300 focus:ring-blue-500";
  const fileText = dark ? "text-white/40" : "text-gray-500";
  const fileBtn = dark
    ? "file:bg-indigo-900/60 file:text-indigo-300 hover:file:bg-indigo-800/60"
    : "file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100";

  const [email, setEmail] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [wantsAccount, setWantsAccount] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [createdAccount, setCreatedAccount] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email && !linkedin && !github && !cardFile) {
      setError("Please provide at least one way to connect.");
      return;
    }

    if (wantsAccount) {
      if (!username || !password) {
        setError("Enter a username and password to create an account.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match.");
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
    }

    setSubmitting(true);
    try {
      let cardFilename: string | undefined;

      // Upload business card photo first if provided, get back a private filename
      if (cardFile) {
        const fd = new FormData();
        fd.append("file", cardFile);
        const upRes = await fetch("/api/private-upload", { method: "POST", body: fd });
        if (!upRes.ok) {
          const { error: upErr } = await upRes.json();
          throw new Error(upErr ?? "Photo upload failed");
        }
        ({ filename: cardFilename } = await upRes.json());
      }

      // Save the connection
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          email: email.trim() || undefined,
          linkedin: linkedin.trim() || undefined,
          github: github.trim() || undefined,
          cardFilename,
        }),
      });

      if (!res.ok) {
        const { error: apiErr } = await res.json();
        throw new Error(apiErr ?? "Something went wrong");
      }

      // Optionally create an account — pre-populate their profile with the info they shared
      if (wantsAccount) {
        const signupRes = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (!signupRes.ok) {
          const { error: signupErr } = await signupRes.json();
          // Connection was already saved — show partial success message
          setError(`Connected! But account creation failed: ${signupErr}`);
          setDone(true);
          return;
        }
        setCreatedAccount(true);
      }

      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (done && createdAccount) {
    return (
      <div className="text-center py-8 px-6">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className={`text-2xl font-bold mb-2 ${dark ? "text-white" : "text-gray-900"}`}>
          You&apos;re connected!
        </h2>
        <p className={`mb-5 ${dark ? "text-white/50" : "text-gray-600"}`}>
          Account created. Go to your dashboard to set up your own card.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
        >
          Go to my dashboard →
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-8 px-6">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className={`text-2xl font-bold mb-2 ${dark ? "text-white" : "text-gray-900"}`}>
          You&apos;re connected!
        </h2>
        <p className={dark ? "text-white/50" : "text-gray-600"}>
          {profileName} will be in touch. Great meeting you!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={`block text-sm font-medium mb-1 ${label}`}>
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${input}`}
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${label}`}>
          LinkedIn (username or URL)
        </label>
        <input
          type="text"
          value={linkedin}
          onChange={(e) => setLinkedin(e.target.value)}
          placeholder="linkedin.com/in/yourname"
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${input}`}
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${label}`}>
          GitHub (username or URL)
        </label>
        <input
          type="text"
          value={github}
          onChange={(e) => setGithub(e.target.value)}
          placeholder="github.com/yourname"
          className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${input}`}
        />
      </div>

      <div>
        <label className={`block text-sm font-medium mb-1 ${label}`}>
          Business card photo
        </label>
        {/* accept="image/*" + capture="environment" opens rear camera on iPhone/Android */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          // eslint-disable-next-line react/no-unknown-property
          capture="environment"
          onChange={(e) => setCardFile(e.target.files?.[0] ?? null)}
          className={`w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium ${fileText} ${fileBtn}`}
        />
        {cardFile && (
          <p className={`mt-1 text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>
            Selected: {cardFile.name} ({(cardFile.size / 1024).toFixed(0)} KB)
          </p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-900/30 border border-red-700/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Optional: create an account to get your own networking card */}
      <div className={`border rounded-xl overflow-hidden ${dark ? "border-white/10" : "border-gray-200"}`}>
        <button
          type="button"
          onClick={() => setWantsAccount((v) => !v)}
          className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${
            dark
              ? "text-white/60 hover:text-white/80 bg-white/5"
              : "text-gray-600 hover:text-gray-800 bg-gray-50"
          }`}
        >
          <span>✦ Create your own networking account</span>
          <span className="text-xs opacity-60">{wantsAccount ? "▲ hide" : "▼ show"}</span>
        </button>

        {wantsAccount && (
          <div className={`p-4 space-y-3 ${dark ? "bg-white/5" : "bg-gray-50"}`}>
            <p className={`text-xs ${dark ? "text-white/40" : "text-gray-500"}`}>
              Get your own card + QR code to share at events.
            </p>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              autoComplete="username"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${input}`}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 8 chars)"
              autoComplete="new-password"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${input}`}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              autoComplete="new-password"
              className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${input}`}
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors"
      >
        {submitting ? "Sending…" : wantsAccount ? "Connect & create account" : "Connect"}
      </button>
    </form>
  );
}
