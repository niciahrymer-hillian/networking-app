"use client";
// Back / forward / reload buttons for the installed PWA. A standalone PWA hides the
// browser chrome, so these give users the navigation they'd otherwise miss. They
// render ONLY when running installed (display-mode: standalone, or iOS Safari's
// navigator.standalone) — in a normal browser tab they stay hidden since the browser
// already provides them.
import { useEffect, useState } from "react";

const ICON = "h-5 w-5";

export default function PwaNavControls() {
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari home-screen apps expose this non-standard flag
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(!!standalone);
  }, []);

  if (!installed) return null;

  const btn =
    "p-1.5 rounded-lg text-body hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors";

  return (
    <div className="flex items-center gap-0.5 shrink-0" role="group" aria-label="App navigation">
      <button type="button" onClick={() => history.back()} aria-label="Back" className={btn}>
        <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <button type="button" onClick={() => history.forward()} aria-label="Forward" className={btn}>
        <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
      <button type="button" onClick={() => window.location.reload()} aria-label="Reload" className={btn}>
        <svg viewBox="0 0 24 24" className={ICON} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12a9 9 0 1 1-2.64-6.36" /><path d="M21 3v6h-6" />
        </svg>
      </button>
    </div>
  );
}
