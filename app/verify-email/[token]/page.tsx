"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { authButton } from "@/components/AuthShell";

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
    <AuthShell
      emoji={status === "success" ? "✅" : status === "error" ? "❌" : "⌛"}
      title="Email verification"
      subtitle={message}
    >
      <button type="button" onClick={() => router.push("/login")} className={authButton}>
        Go to sign in
      </button>
    </AuthShell>
  );
}
