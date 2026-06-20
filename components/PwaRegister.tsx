"use client";
// Registers the service worker (/sw.js) once on mount, in production only.
// WHY: the SW is what lets browsers offer "Install app". Kept in its own client
// component so the root layout can stay a server component.
import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failures are non-fatal — the app still works, just isn't installable.
    });
  }, []);
  return null;
}
