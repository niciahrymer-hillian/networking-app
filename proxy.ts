// Route-level auth guard using iron-session in the Edge runtime.
// WHY: Protecting routes in middleware is more efficient than checking auth in every page/layout —
//      unauthenticated requests are redirected before any DB or render work happens.
// EFFECT: All routes except the public ones (homepage, /p/* profiles, auth pages,
//         /api/auth/*, and the public connect endpoints /api/connections +
//         /api/private-upload) require a valid session.

import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "./lib/session";

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow: public homepage, public profile pages, login page, auth API endpoints, static assets, and Next.js internals
  if (
    pathname === "/" ||
    pathname.startsWith("/p/") ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password/") ||
    pathname === "/faqs" ||
    pathname.startsWith("/api/auth/") ||
    pathname === "/api/connections" ||
    pathname.startsWith("/api/private-upload") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname === "/logo.svg" ||
    pathname === "/logo.png" ||
    // PWA assets must be reachable without a session (browser fetches them while
    // installing / for the app icon + splash).
    pathname === "/manifest.webmanifest" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/icon-") ||
    pathname.startsWith("/apple-icon") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/api/uploads/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Read the session from the request cookie
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions
  );

  if (!session.isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin area — non-admins are bounced to their dashboard. (The /api/admin/*
  // routes additionally enforce requireAdmin and return JSON 401/403, so they're
  // intentionally not redirected here.) isAdmin is stamped into the session at
  // login, so a freshly-promoted admin just needs to sign in again.
  if (pathname.startsWith("/admin") && !session.isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  // Run proxy on all routes except static assets and uploaded files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"]
};
