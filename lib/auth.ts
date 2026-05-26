// Auth helpers for Server Components and Route Handlers.
// WHY: Wrapping iron-session here keeps auth logic in one place so API routes
//      don't need to repeat cookie/session boilerplate.

import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "./session";
import { prisma } from "@/lib/db";

// Returns the current session — works in Server Components, Route Handlers, and Server Actions.
// EFFECT: Reads the encrypted session cookie from the incoming request.
export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

// Returns the session only if the user is logged in, null otherwise.
// EFFECT: Used by API routes to gate access without throwing.
export async function requireAuth() {
  const session = await getSession();
  if (!session.isLoggedIn) return null;
  return session;
}

// Returns the session only if the user is an administrator.
// EFFECT: Used by admin routes/pages to protect superuser operations.
export async function requireAdmin() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) return null;

  if (session.isAdmin) return session;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user?.isAdmin) return null;

  session.isAdmin = true;
  return session;
}
