// PATCH /api/account — update account-level identity (display name + avatar).
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const session = await requireAuth();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await prisma.user.findUnique({ where: { id: session.userId }, select: { name: true, avatarUrl: true, username: true } });
  return NextResponse.json(u ?? {});
}

export async function PATCH(request: NextRequest) {
  const session = await requireAuth();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, avatarUrl } = (await request.json().catch(() => ({}))) as { name?: string; avatarUrl?: string };
  await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: typeof name === "string" ? name.trim().slice(0, 80) || null : undefined,
      avatarUrl: typeof avatarUrl === "string" ? avatarUrl.trim() || null : undefined,
    },
  });
  return NextResponse.json({ ok: true });
}
