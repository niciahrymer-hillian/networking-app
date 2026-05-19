// POST /api/auth/forgot-password — generate a password reset token.
// WHY: No email is configured, so the token is shown on-screen. The user must
//      also provide the server's ADMIN_PASSWORD as a recovery key to prove
//      they have access to the deployment — not just the browser.
// EFFECT: Stores a reset token + 1-hour expiry on the User row.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_PASSWORD_RECOVERY_KEY !== "true"
  ) {
    return NextResponse.json(
      { error: "Password recovery is disabled in production" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { username, recoveryKey } = body as { username?: string; recoveryKey?: string };

  if (!username || !recoveryKey) {
    return NextResponse.json({ error: "Username and recovery key are required" }, { status: 400 });
  }

  // The recovery key is the ADMIN_PASSWORD env var — only someone with server access knows it
  if (recoveryKey !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Invalid recovery key" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    // Return generic message to avoid username enumeration
    return NextResponse.json({ token: null, message: "If that username exists, a reset token was generated." });
  }

  const token = randomUUID();
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  return NextResponse.json({ token });
}
