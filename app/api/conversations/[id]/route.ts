// GET   /api/conversations/:id — thread: participants + messages (with reactions
//        and shared posts). Polled by the open chat.
// PATCH /api/conversations/:id — group admin actions (admins only):
//        { action: "rename", name } | "addMembers", userIds } | "removeMember", userId }
//        | "setAdmin", userId } (delegate/share admin).

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { convoUserSelect, displayUser, participantOf } from "@/lib/conversations";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireAuth();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = session.userId;
  const { id } = await params;

  const part = await participantOf(id, me);
  if (!part) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Opening the thread marks it read (powers the Messages unread badge). Fire-and-forget.
  prisma.conversationParticipant
    .updateMany({ where: { conversationId: id, userId: me }, data: { lastReadAt: new Date() } })
    .catch(() => {});

  const convo = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: { include: { user: { select: convoUserSelect } } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: { select: convoUserSelect },
          reactions: { select: { emoji: true, userId: true } },
          sharedPost: { select: { id: true, content: true, mediaUrl: true, mediaType: true, linkUrl: true, author: { select: convoUserSelect } } },
        },
      },
    },
  });
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const participants = convo.participants.map((p) => ({ ...displayUser(p.user), isAdmin: p.isAdmin }));
  const others = participants.filter((p) => p.id !== me);
  const messages = convo.messages.map((m) => {
    const byEmoji = new Map<string, number>();
    let mine: string | null = null;
    for (const r of m.reactions) {
      byEmoji.set(r.emoji, (byEmoji.get(r.emoji) ?? 0) + 1);
      if (r.userId === me) mine = r.emoji;
    }
    return {
      id: m.id,
      senderId: m.senderId,
      sender: displayUser(m.sender),
      body: m.body,
      createdAt: m.createdAt,
      reactions: [...byEmoji.entries()].map(([emoji, count]) => ({ emoji, count })),
      myReaction: mine,
      sharedPost: m.sharedPost
        ? { id: m.sharedPost.id, content: m.sharedPost.content, mediaUrl: m.sharedPost.mediaUrl, mediaType: m.sharedPost.mediaType, linkUrl: m.sharedPost.linkUrl, author: displayUser(m.sharedPost.author) }
        : null,
    };
  });

  return NextResponse.json({
    id: convo.id,
    isGroup: convo.isGroup,
    name: convo.name,
    title: convo.isGroup ? convo.name ?? "Group chat" : others[0]?.name ?? (others[0] ? `@${others[0].username}` : "Conversation"),
    viewerIsAdmin: part.isAdmin,
    participants,
    messages,
  });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await requireAuth();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const me = session.userId;
  const { id } = await params;

  const convo = await prisma.conversation.findUnique({ where: { id }, select: { isGroup: true } });
  if (!convo?.isGroup) return NextResponse.json({ error: "Not a group" }, { status: 400 });
  const part = await participantOf(id, me);
  if (!part?.isAdmin) return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as { action?: string; name?: string; userId?: string; userIds?: string[] };

  switch (body.action) {
    case "rename": {
      const name = (body.name ?? "").trim();
      if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });
      await prisma.conversation.update({ where: { id }, data: { name: name.slice(0, 80) } });
      break;
    }
    case "addMembers": {
      const ids = [...new Set((body.userIds ?? []).filter((u) => typeof u === "string"))];
      // Rule: an admin can only add their own connections.
      const myConns = new Set(
        (await prisma.userConnection.findMany({ where: { userId: me }, select: { connectedUserId: true } })).map((c) => c.connectedUserId)
      );
      for (const userId of ids) {
        if (!myConns.has(userId)) continue;
        await prisma.conversationParticipant.upsert({
          where: { conversationId_userId: { conversationId: id, userId } },
          create: { conversationId: id, userId },
          update: {},
        });
      }
      break;
    }
    case "removeMember": {
      if (!body.userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
      await prisma.conversationParticipant.deleteMany({ where: { conversationId: id, userId: body.userId } });
      break;
    }
    case "setAdmin": {
      if (!body.userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
      await prisma.conversationParticipant.updateMany({ where: { conversationId: id, userId: body.userId }, data: { isAdmin: true } });
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
  await prisma.conversation.update({ where: { id }, data: { updatedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
