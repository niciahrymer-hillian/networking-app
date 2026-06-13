"use client";
// Route-level error boundary (fallback protocol): catches render/data errors in
// any segment and offers a retry instead of crashing the whole app.

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface for debugging; in prod the digest correlates to server logs.
    console.error("Route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <p className="mb-4 text-5xl">😵‍💫</p>
      <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        An unexpected error occurred. You can try again, or head back home.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500">
          Try again
        </button>
        <a href="/" className="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-body transition hover:bg-elevated">
          Go home
        </a>
      </div>
    </main>
  );
}
