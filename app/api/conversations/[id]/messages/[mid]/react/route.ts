// POST /api/conversations/:id/messages/:mid/react — react to a message ({ emoji }).
// One reaction per user per message; same emoji toggles it off.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { participantOf } from "@/lib/conversations";
import { isValidReaction } from "@/lib/reactions";

type Params = { params: Promise<{ id: string; mid: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const session = await requireAuth();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = session.userId;
  const { id, mid } = await params;

  const part = await participantOf(id, me);
  if (!part) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { emoji } = (await request.json().catch(() => ({}))) as { emoji?: string };
  if (!emoji || !isValidReaction(emoji)) return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });

  const msg = await prisma.message.findUnique({ where: { id: mid }, select: { conversationId: true } });
  if (!msg || msg.conversationId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const key = { messageId_userId: { messageId: mid, userId: me } };
  const existing = await prisma.messageReaction.findUnique({ where: key });
  if (existing && existing.emoji === emoji) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ reaction: null });
  }
  await prisma.messageReaction.upsert({ where: key, create: { messageId: mid, userId: me, emoji }, update: { emoji } });
  return NextResponse.json({ reaction: emoji });
}
