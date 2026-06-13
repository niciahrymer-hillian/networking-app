// POST /api/conversations/:id/messages — send a message ({ body?, sharedPostId? }).
// Either text, a shared post, or both. Caller must be a participant.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { participantOf } from "@/lib/conversations";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const session = await requireAuth();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = session.userId;
  const { id } = await params;

  const part = await participantOf(id, me);
  if (!part) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { body, sharedPostId } = (await request.json().catch(() => ({}))) as { body?: string; sharedPostId?: string };
  const text = (body ?? "").trim();
  if (!text && !sharedPostId) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  let shared: string | null = null;
  if (sharedPostId) {
    const p = await prisma.post.findUnique({ where: { id: sharedPostId }, select: { id: true } });
    if (p) shared = p.id;
  }

  const msg = await prisma.message.create({
    data: { conversationId: id, senderId: me, body: text ? text.slice(0, 4000) : null, sharedPostId: shared },
  });
  await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
  return NextResponse.json({ id: msg.id }, { status: 201 });
}
