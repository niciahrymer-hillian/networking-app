// POST /api/network/connect — create a mutual network link with another account.
// WHY: When a logged-in user connects with a card, both accounts join each other's
//      network so they see each other's posts in the feed. Idempotent.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ownerUserId } = (await req.json()) as { ownerUserId?: string };
  if (!ownerUserId) {
    return NextResponse.json({ error: "ownerUserId is required" }, { status: 400 });
  }
  if (ownerUserId === session.userId) {
    return NextResponse.json({ error: "You can't connect with yourself" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: ownerUserId }, select: { id: true } });
  if (!target) {
    return NextResponse.json({ error: "That account no longer exists" }, { status: 404 });
  }

  // Mutual: write both directions, idempotently (compound-unique upsert).
  for (const [a, b] of [
    [session.userId, ownerUserId],
    [ownerUserId, session.userId],
  ]) {
    await prisma.userConnection.upsert({
      where: { userId_connectedUserId: { userId: a, connectedUserId: b } },
      create: { userId: a, connectedUserId: b },
      update: {},
    });
  }

  return NextResponse.json({ ok: true });
}
