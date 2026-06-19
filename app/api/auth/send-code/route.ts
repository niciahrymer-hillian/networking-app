import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/mail";
import { emailMatchClauses } from "@/lib/user-email";

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { email } = body as { email?: string };
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

  const normalized = email.trim().toLowerCase();
  const user = await prisma.user.findFirst({ where: { OR: emailMatchClauses(email) } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const code = generateCode();
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.user.update({ where: { id: user.id }, data: { emailVerificationToken: code, emailVerificationExpiry: expiry } });

  try {
    await sendVerificationEmail(normalized, code);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
