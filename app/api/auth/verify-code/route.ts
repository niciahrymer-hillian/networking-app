import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { email, code } = body as { email?: string; code?: string };
  if (!email || !code) return NextResponse.json({ error: 'Email and code required' }, { status: 400 });

  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  if (!user.emailVerificationToken || !user.emailVerificationExpiry) {
    return NextResponse.json({ error: 'No verification requested' }, { status: 400 });
  }

  const now = new Date();
  if (user.emailVerificationExpiry < now) {
    return NextResponse.json({ error: 'Verification code expired' }, { status: 400 });
  }

  if (user.emailVerificationToken !== code) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true, emailVerificationToken: null, emailVerificationExpiry: null } });

  return NextResponse.json({ ok: true });
}
