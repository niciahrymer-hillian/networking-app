"use client";
// One-tap PWA install button. Appears only when the browser fires
// `beforeinstallprompt` (Android + desktop Chrome/Edge). On iOS Safari that event
// doesn't exist, so the button stays hidden and users follow the manual FAQ steps.
import { useEffect, useState } from "react";

// Minimal shape of the non-standard beforeinstallprompt event.
interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton({ className = "" }: { className?: string }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // stop Chrome's mini-infobar; we drive it from the button
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    // Already running as an installed app?
    if (window.matchMedia?.("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return <p className={`text-sm text-emerald-700 dark:text-emerald-300 ${className}`}>✓ App installed</p>;
  }
  if (!deferred) return null; // not installable here (e.g. iOS) → FAQ steps apply

  return (
    <button
      type="button"
      onClick={async () => {
        await deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
      }}
      className={`inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 transition-colors ${className}`}
    >
      ⬇️ Install the app
    </button>
  );
}
