// POST /api/auth/login — validates username + password and creates a session cookie.
// WHY: Multi-user auth via User table. Falls back to ADMIN_PASSWORD env var when no
//      users exist yet (first-run bootstrap) so the app works out of the box.
// EFFECT: Sets an encrypted iron-session cookie with userId + username.

import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  // Try DB user first
  const user = await prisma.user.findUnique({ where: { username } });

  if (user) {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
    }
    session.isLoggedIn = true;
    session.userId = user.id;
    session.username = user.username;
    await session.save();
    return response;
  }

  // Bootstrap fallback: no users in DB yet — accept ADMIN_PASSWORD with username "admin"
  const userCount = await prisma.user.count();
  if (userCount === 0 && username === "admin" && password === process.env.ADMIN_PASSWORD) {
    // Auto-create the admin user so future logins use the DB
    const hash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({ data: { username, passwordHash: hash } });
    session.isLoggedIn = true;
    session.userId = newUser.id;
    session.username = newUser.username;
    await session.save();
    return response;
  }

  return NextResponse.json({ error: "Incorrect username or password" }, { status: 401 });
}
