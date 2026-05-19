// POST /api/auth/signup — create a new user account.
// WHY: Multi-user support — anyone can sign up to get their own card and dashboard.
// EFFECT: Creates a User row, sets a session, returns ok.

import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SIGNUP !== "true") {
    return NextResponse.json({ error: "Sign up is disabled" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }
  if (username.length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { username, passwordHash } });

  const response = NextResponse.json({ ok: true }, { status: 201 });
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  session.isLoggedIn = true;
  session.userId = user.id;
  session.username = user.username;
  await session.save();

  return response;
}
