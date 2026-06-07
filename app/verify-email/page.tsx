"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { authInput, authButton } from "@/components/AuthShell";

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
    <AuthShell emoji="✉️" title="Verify your email">
      {step === 'enter' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-500">Enter the email you signed up with to receive a 6-digit verification code.</p>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={authInput} />
          <button onClick={sendCode} className={authButton}>Send code</button>
        </div>
      )}

      {step === 'code' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-slate-500">Enter the 6-digit code sent to <strong className="text-slate-700">{email}</strong>.</p>
          <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" className={authInput} />
          <div className="flex gap-3">
            <button onClick={verify} className={authButton}>Verify</button>
            <button onClick={sendCode} className="flex-1 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium py-3 rounded-xl transition-colors">Resend</button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <p className="text-slate-700">Verified — redirecting to sign in…</p>
      )}

      {message && <p className="mt-4 text-sm text-slate-500">{message}</p>}
    </AuthShell>
  );
}
