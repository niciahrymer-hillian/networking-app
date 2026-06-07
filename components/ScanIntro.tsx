// Greeting intro for the scanned profile card.
// WHY: When someone scans the QR, greet them first ("Hello! Nice to meet you"),
//      then let them scroll down to the card. This is a scroll-based reveal with
//      NO JavaScript: the old version used a fixed overlay dismissed on tap / a
//      timer, which could get stuck if the client failed to hydrate. Pure markup
//      can't get stuck, and the "Scroll" affordance is a real anchor link so it
//      works even with no scrolling.

import type { ReactNode } from "react";

export default function ScanIntro({
  firstName,
  children,
}: {
  firstName: string;
  children: ReactNode;
}) {
  return (
    <>
      {/* Greeting hero — fills the viewport; scroll (or tap the hint) for the card */}
      <section className="min-h-[86svh] w-full flex flex-col items-center justify-center text-center animate-fade-up">
        <span className="text-7xl mb-5 animate-wave">👋</span>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-emerald-700">
          Hello!
        </h1>
        <p className="mt-3 text-lg text-slate-600 max-w-xs">
          Nice to meet you — let&apos;s connect with {firstName}.
        </p>

        <a
          href="#card"
          className="mt-12 flex flex-col items-center gap-2 text-emerald-700 hover:text-emerald-600 transition-colors"
        >
          <span className="text-xs uppercase tracking-[0.3em]">View card</span>
          <span className="text-2xl animate-bob">↓</span>
        </a>
      </section>

      {/* The card — anchor target for the scroll hint */}
      <div id="card" className="w-full flex flex-col items-center scroll-mt-4">
        {children}
      </div>
    </>
  );
}
