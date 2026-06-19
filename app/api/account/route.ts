// PATCH /api/account — update account-level identity (display name + avatar).
//
// RULE (identity propagation): the account's full name is the single source of
// truth for a person's name. When it changes we ALSO rewrite the name on every
// card they own (Profile.name), so the change flows through to their profile
// cards, business card, and QR landing page (/p/<slug> renders Profile.name).
// Feed/comments already read User.name live, so connections see it immediately.
// See references/identity-name-propagation.md.
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
  const cleanName = typeof name === "string" ? name.trim().slice(0, 80) : undefined;

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: cleanName === undefined ? undefined : cleanName || null,
      avatarUrl: typeof avatarUrl === "string" ? avatarUrl.trim() || null : undefined,
    },
  });

  // Propagate the full name onto the user's cards so the business card + QR
  // landing page reflect it. Only when a non-empty name was provided — clearing
  // the account name should not blank out the cards (Profile.name is required).
  if (cleanName) {
    await prisma.profile.updateMany({
      where: { userId: session.userId },
      data: { name: cleanName },
    });
  }

  return NextResponse.json({ ok: true });
}
