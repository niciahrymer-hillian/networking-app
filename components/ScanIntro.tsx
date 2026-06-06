"use client";
// Greeting intro for the scanned profile card.
// WHY: When someone scans the QR, greet them first ("Hello! Nice to meet you"),
//      then slide that greeting away while the card fades/slides in underneath.
// EFFECT: Full-screen emerald greeting auto-dismisses after a beat (or on tap),
//         then reveals the server-rendered card (passed as children).

import { useEffect, useState } from "react";

export default function ScanIntro({
  firstName,
  children,
}: {
  firstName: string;
  children: React.ReactNode;
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 1700);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Greeting — slides up and fades out to reveal the card */}
      <div
        onClick={() => setRevealed(true)}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 px-6 text-center text-white transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          revealed ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        }`}
      >
        <p className="text-6xl mb-4 animate-fade-up">👋</p>
        <h1 className="text-4xl font-bold tracking-tight animate-fade-up [animation-delay:120ms]">
          Hello!
        </h1>
        <p className="mt-3 text-lg text-white/90 animate-fade-up [animation-delay:240ms]">
          Nice to meet you — let&apos;s connect with {firstName}.
        </p>
        <p className="mt-10 text-xs uppercase tracking-[0.3em] text-white/60 animate-fade-up [animation-delay:600ms]">
          tap to continue
        </p>
      </div>

      {/* Card fades/slides in as the greeting leaves */}
      <div
        className={`transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {children}
      </div>
    </>
  );
}
