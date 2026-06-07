"use client";
// Light/dark toggle. The actual class is applied pre-paint by the inline script
// in layout.tsx (reading localStorage / OS preference); this button just flips it
// and persists the choice. Initial icon resolves on mount to match that script.

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* private mode / storage disabled — toggle still works for the session */
    }
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark ?? false}
      title="Toggle theme"
      className="text-base text-muted hover:bg-emerald-50 dark:hover:bg-emerald-500/10 px-2.5 py-1.5 rounded-lg transition-colors"
    >
      <span suppressHydrationWarning>{dark ? "☀️" : "🌙"}</span>
    </button>
  );
}
