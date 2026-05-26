// POST /api/auth/account-reset — generate a password reset token for the current user.
// WHY: Logged-in users may need a password reset link without knowing their current password.
// EFFECT: Creates a reset token + expiry on the current User row and returns a reset URL.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const token = randomUUID();
  const expiry = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  const resetUrl = `/reset-password/${token}`;
  return NextResponse.json({ ok: true, resetUrl, expiresAt: expiry.toISOString() });
}
