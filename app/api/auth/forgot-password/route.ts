// POST /api/auth/forgot-password — generate a password reset token.
// WHY: Users can request a password reset by username or email.
// EFFECT: Stores a reset token + 1-hour expiry on the User row.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

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

  return NextResponse.json({
    token,
    email: user.email,
    message: "A reset link was generated. Use the link below or check your email if delivery is configured.",
  });
}
