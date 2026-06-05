import { headers } from "next/headers";

// Returns the absolute origin the app is currently served from, e.g.
// "https://networking-app-y3gq.vercel.app" in production or
// "http://localhost:3000" in local dev.
//
// WHY: QR codes must encode an absolute URL a phone can open. The previous
// approach read this from the APP_URL env var, which silently fell back to
// "http://localhost:3000" whenever the var was unset or wrong — producing QR
// codes that "cannot open" once scanned. Deriving the origin from the incoming
// request makes it self-healing: the QR always points back to whatever domain
// actually served the page, so there is no env var to keep in sync (and no way
// to accidentally point at a deleted/old domain).
//
// Server-only: it reads request headers, so call it from a Server Component.
export async function getAppUrl(): Promise<string> {
  const h = await headers();
  // x-forwarded-host is set by Vercel's proxy; `host` is the direct fallback.
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    // Vercel sets x-forwarded-proto to https. Locally there's no proxy, so
    // infer http for localhost and https for any real domain.
    const proto =
      h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  // No request context (not expected for our call sites): honor an explicit
  // APP_URL override if present, otherwise assume local dev.
  return process.env.APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
}
