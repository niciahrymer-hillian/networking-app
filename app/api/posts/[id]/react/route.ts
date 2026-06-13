// POST /api/posts/:id/react  — set / change / toggle the caller's reaction on a post.
// Body: { emoji }. One reaction per user per post: reacting with the same emoji
// removes it (toggle off); a different emoji replaces it.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { isValidReaction } from "@/lib/reactions";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const session = await requireAuth();
  if (!session?.userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { emoji } = (await request.json().catch(() => ({}))) as { emoji?: string };
  if (!emoji || !isValidReaction(emoji))
    return NextResponse.json({ error: "Invalid reaction" }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const key = { postId_userId: { postId: id, userId: session.userId } };
  const existing = await prisma.reaction.findUnique({ where: key });

  if (existing && existing.emoji === emoji) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ reaction: null });
  }

  await prisma.reaction.upsert({
    where: key,
    create: { postId: id, userId: session.userId, emoji },
    update: { emoji },
  });
  return NextResponse.json({ reaction: emoji });
}
