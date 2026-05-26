"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");
  const [message, setMessage] = useState("Verifying your email…");

  useEffect(() => {
    async function verify() {
      const { token } = await params;
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("Your email is verified. You can now sign in.");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Verification failed.");
      }
    }
    verify();
  }, [params]);

  return (
    <main className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-4xl mb-3">{status === "success" ? "✅" : status === "error" ? "❌" : "⌛"}</div>
        <h1 className="text-2xl font-bold text-white mb-2">Email verification</h1>
        <p className="text-white/60 mb-6">{message}</p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors"
        >
          Go to sign in
        </button>
      </div>
    </main>
  );
}
