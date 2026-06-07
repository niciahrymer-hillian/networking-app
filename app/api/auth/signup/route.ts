// POST /api/auth/signup — create a new user account and sign them in.
// WHY: Email verification is not required for MVP — new accounts are usable immediately.
//      The verify-email routes/fields are kept for optional verification later.
// EFFECT: Creates a User row and sets an encrypted iron-session cookie.

import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  // Signup is open by default. Set DISABLE_SIGNUP=true to turn it into an
  // admin-only/closed deployment (kill-switch).
  if (process.env.DISABLE_SIGNUP === "true") {
    return NextResponse.json({ error: "Sign up is disabled" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { username, email, password } = body as {
    username?: string;
    email?: string;
    password?: string;
  };

  if (!username || !email || !password) {
    return NextResponse.json({ error: "Username, email, and password are required" }, { status: 400 });
  }
  if (username.length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
  }
  if (!isEmail(email)) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const normalizedEmail = normalizeEmail(email);
  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }
  const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingEmail) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      username,
      email: normalizedEmail,
      passwordHash,
      emailVerified: false, // not required to sign in; users can verify later via the verify routes
    },
  });

  // Sign the new user in immediately — no email verification step for MVP.
  const response = NextResponse.json({ ok: true }, { status: 201 });
  const session = await getIronSession<SessionData>(request, response, sessionOptions);
  session.isLoggedIn = true;
  session.isAdmin = user.isAdmin ?? false;
  session.userId = user.id;
  session.username = user.username;
  await session.save();
  return response;
}
