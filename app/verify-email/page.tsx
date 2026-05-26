"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmail() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<'enter'|'code'|'done'>('enter');
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function sendCode() {
    setMessage(null);
    const res = await fetch('/api/auth/send-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    const data = await res.json();
    if (res.ok) {
      setStep('code');
      setMessage('Verification code sent. Check your email.');
    } else {
      setMessage(data.error || 'Failed to send code');
    }
  }

  async function verify() {
    setMessage(null);
    const res = await fetch('/api/auth/verify-code', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, code }) });
    const data = await res.json();
    if (res.ok) {
      setStep('done');
      setMessage('Email verified — you can now sign in.');
      setTimeout(() => router.push('/login'), 1200);
    } else {
      setMessage(data.error || 'Verification failed');
    }
  }

  return (
    <main className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
      <div className="w-full max-w-md p-6 rounded-2xl bg-white/5 border border-white/10 text-white">
        <h1 className="text-2xl font-semibold mb-4">Verify your email</h1>
        {step === 'enter' && (
          <>
            <p className="text-sm text-white/60 mb-4">Enter the email you signed up with to receive a 6-digit verification code.</p>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full mb-3 rounded-md bg-transparent border border-white/10 p-3 text-white" />
            <button onClick={sendCode} className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-md">Send code</button>
          </>
        )}

        {step === 'code' && (
          <>
            <p className="text-sm text-white/60 mb-4">Enter the 6-digit code sent to <strong>{email}</strong>.</p>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className="w-full mb-3 rounded-md bg-transparent border border-white/10 p-3 text-white" />
            <div className="flex gap-3">
              <button onClick={verify} className="flex-1 bg-indigo-600 hover:bg-indigo-500 py-3 rounded-md">Verify</button>
              <button onClick={sendCode} className="flex-1 border border-white/10 py-3 rounded-md">Resend</button>
            </div>
          </>
        )}

        {step === 'done' && (
          <p className="text-white">Verified — redirecting to sign in…</p>
        )}

        {message && <p className="mt-4 text-sm text-white/70">{message}</p>}
      </div>
    </main>
  );
}
