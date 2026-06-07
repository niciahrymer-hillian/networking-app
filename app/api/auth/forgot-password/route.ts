// POST /api/auth/forgot-password — generate a password reset token + email it.
// WHY: Users can request a password reset by username or email.
// EFFECT: Stores a reset token + 1-hour expiry on the User row, then emails the
//         reset link via Resend. The raw token is only returned to the client in
//         development (so dev can test without email); in production it is NOT
//         returned — that would let anyone reset any account by reading the page.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { getAppUrl } from "@/lib/app-url";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { usernameOrEmail } = body as { usernameOrEmail?: string };

  if (!usernameOrEmail) {
    return NextResponse.json({ error: "Username or email is required" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: usernameOrEmail }, { email: usernameOrEmail.toLowerCase().trim() }],
    },
  });

  if (!user) {
    return NextResponse.json({
      token: null,
      message: "If that account exists, a reset token was generated.",
    });
  }

  const token = randomUUID();
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  // Email the reset link. Don't fail the request if email delivery hiccups —
  // the token is saved either way, and in dev the link is returned below.
  if (user.email) {
    const appUrl = await getAppUrl();
    const resetUrl = `${appUrl}/reset-password/${token}`;
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (err) {
      console.error("[forgot-password] email send failed", err);
    }
  }

  const isDev = process.env.NODE_ENV !== "production";
  return NextResponse.json({
    email: user.email,
    message: "If that account exists, a reset link is on its way to its email.",
    // Only expose the raw token in development — never in production.
    ...(isDev ? { token } : {}),
  });
}
