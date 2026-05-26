// Route-level auth guard using iron-session in the Edge runtime.
// WHY: Protecting routes in middleware is more efficient than checking auth in every page/layout —
//      unauthenticated requests are redirected before any DB or render work happens.
// EFFECT: All routes except /login, /p/* (public profiles), and /api/auth/* require a valid session.

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
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/images/") ||
    pathname === "/logo.svg" ||
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

  return response;
}

export const config = {
  // Run proxy on all routes except static assets and uploaded files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads/).*)"]
};
