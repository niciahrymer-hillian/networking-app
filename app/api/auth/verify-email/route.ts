// POST /api/auth/verify-email — confirm a user's email verification token.
// WHY: New accounts must verify their email before they can sign in.
// EFFECT: Marks emailVerified=true and clears the verification token.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { token } = body as { token?: string };

  if (!token) {
    return NextResponse.json({ error: "Verification token is required" }, { status: 400 });
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    },
  });

  return NextResponse.json({ ok: true });
}
