"use client";
// Sets the installed PWA's app-icon badge (the little number on the home-screen /
// dock icon) via the Web Badging API. Mirrors the in-app nav bubbles. Updates on
// every navigation (when this re-renders with a new count). Background updates would
// need push + a service worker — out of scope; this covers "while the app is used".
//
// Supported on desktop Chrome/Edge, Android (installed), and iOS/macOS Safari 16.4+
// for installed web apps; a no-op everywhere else.
import { useEffect } from "react";

export default function AppBadge({ count }: { count: number }) {
  useEffect(() => {
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    if (!("setAppBadge" in nav)) return;
    if (count > 0) nav.setAppBadge?.(count).catch(() => {});
    else nav.clearAppBadge?.().catch(() => {});
  }, [count]);
  return null;
}
