// POST /api/auth/login — validates username/email + password and creates a session cookie.
// WHY: Login uses username or email. Email verification is not required to sign in.
// EFFECT: Sets an encrypted iron-session cookie with userId + username.

import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { emailMatchClauses } from "@/lib/user-email";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { usernameOrEmail, password } = body as {
    usernameOrEmail?: string;
    password?: string;
  };

  if (!usernameOrEmail || !password) {
    return NextResponse.json({ error: "Username/email and password are required" }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  // Usernames are stored normalized (lowercase); match case-insensitively.
  // Email is matched via emailHash (encrypted rows) or plaintext (legacy rows).
  const normalized = usernameOrEmail.toLowerCase().trim();
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: normalized }, ...emailMatchClauses(usernameOrEmail)] },
  });

  if (user) {
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect username/email or password" }, { status: 401 });
    }
    session.isLoggedIn = true;
    session.isAdmin = user.isAdmin ?? false;
    session.userId = user.id;
    session.username = user.username;
    await session.save();
    return response;
  }

  const userCount = await prisma.user.count();
  if (userCount === 0 && usernameOrEmail === "admin" && password === process.env.ADMIN_PASSWORD) {
    const hash = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({ data: { username: "admin", email: "admin@example.com", passwordHash: hash, emailVerified: true, isAdmin: true } });
    session.isLoggedIn = true;
    session.isAdmin = true;
    session.userId = newUser.id;
    session.username = newUser.username;
    await session.save();
    return response;
  }

  return NextResponse.json({ error: "Incorrect username/email or password" }, { status: 401 });
}
