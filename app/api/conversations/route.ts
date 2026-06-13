// GET  /api/conversations — list the caller's conversations (DMs + group rooms).
// POST /api/conversations — start a DM ({ userIds:[other] }) or a group
//      ({ userIds:[...], name, isGroup:true }). DMs dedupe to an existing thread.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { convoUserSelect, displayUser } from "@/lib/conversations";

export async function GET() {
  const session = await requireAuth();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = session.userId;

  const convos = await prisma.conversation.findMany({
    where: { participants: { some: { userId: me } } },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: { include: { user: { select: convoUserSelect } } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, sharedPostId: true, createdAt: true },
      },
    },
  });

  const conversations = convos.map((c) => {
    const others = c.participants.filter((p) => p.userId !== me).map((p) => displayUser(p.user));
    const last = c.messages[0];
    return {
      id: c.id,
      isGroup: c.isGroup,
      title: c.isGroup ? c.name ?? "Group chat" : others[0]?.name ?? (others[0] ? `@${others[0].username}` : "Conversation"),
      avatar: c.isGroup ? null : others[0]?.headshotUrl ?? null,
      memberCount: c.participants.length,
      lastMessage: last ? { preview: last.body ?? "📎 Shared a post", when: last.createdAt } : null,
      updatedAt: c.updatedAt,
    };
  });
  return NextResponse.json({ conversations });
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = session.userId;

  const { userIds, name, isGroup } = (await request.json().catch(() => ({}))) as {
    userIds?: string[];
    name?: string;
    isGroup?: boolean;
  };
  const members = [...new Set((userIds ?? []).filter((u) => typeof u === "string" && u !== me))];
  if (members.length === 0) return NextResponse.json({ error: "Pick at least one person" }, { status: 400 });

  // Rule: you can only message people you're connected to.
  const myConnections = new Set(
    (await prisma.userConnection.findMany({ where: { userId: me }, select: { connectedUserId: true } })).map((c) => c.connectedUserId)
  );
  if (members.some((m) => !myConnections.has(m)))
    return NextResponse.json({ error: "You can only message your connections" }, { status: 403 });

  if (!isGroup) {
    const other = members[0];
    // Dedupe: reuse an existing 1:1 DM with this person.
    const existing = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [{ participants: { some: { userId: me } } }, { participants: { some: { userId: other } } }],
      },
      select: { id: true, _count: { select: { participants: true } } },
    });
    if (existing && existing._count.participants === 2) return NextResponse.json({ id: existing.id });

    const convo = await prisma.conversation.create({
      data: { isGroup: false, createdById: me, participants: { create: [{ userId: me }, { userId: other }] } },
    });
    return NextResponse.json({ id: convo.id }, { status: 201 });
  }

  const convo = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: (name?.trim() || "New group").slice(0, 80),
      createdById: me,
      participants: { create: [{ userId: me, isAdmin: true }, ...members.map((u) => ({ userId: u }))] },
    },
  });
  return NextResponse.json({ id: convo.id }, { status: 201 });
}
