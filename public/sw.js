// Minimal service worker — its only job is to make the app installable as a PWA.
// Chrome/Edge require a registered SW with a fetch handler before they'll offer the
// install prompt. We deliberately do NOT cache responses: this is a live, auth'd app
// and stale cached pages/data would be worse than a normal network fetch. So the
// fetch handler is a pass-through (network as usual), and we activate immediately.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Pass-through: required for installability, but no caching (always live).
self.addEventListener("fetch", () => {
  // Intentionally empty — let the browser handle the request normally.
});
