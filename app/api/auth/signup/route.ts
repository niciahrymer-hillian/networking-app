// POST /api/auth/signup — create a new user account and request email verification.
// WHY: New accounts must verify an email address before they can sign in.
// EFFECT: Creates a User row with a verification token and returns a verification link.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SIGNUP !== "true") {
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
  // Generate a 6-digit numeric code for verification
  const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  const user = await prisma.user.create({
    data: {
      username,
      email: normalizedEmail,
      passwordHash,
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
    },
  });

  // Send verification email (optional in dev if SENDGRID_API_KEY missing)
  try {
    const { sendVerificationEmail } = await import('@/lib/mail');
    await sendVerificationEmail(normalizedEmail, verificationToken);
  } catch (err) {
    // swallow — user can request code again from verify page
    console.error('Failed to send verification email during signup', err);
  }

  return NextResponse.json({ ok: true, email: normalizedEmail }, { status: 201 });
}
