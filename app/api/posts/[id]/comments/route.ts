// GET  /api/posts/:id/comments — list a post's comments (with author + replies).
// POST /api/posts/:id/comments — add a comment, or a reply (body: { body, parentId? }).
// Threading is one level: replying to a reply attaches to the top-level comment.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const authorSelect = {
  username: true,
  name: true,
  avatarUrl: true,
  profiles: { select: { name: true, headshotUrl: true, isOwner: true }, orderBy: { createdAt: "asc" as const } },
};

function shape(c: { id: string; body: string; createdAt: Date; parentId: string | null; author: { username: string; name: string | null; avatarUrl: string | null; profiles: { name: string; headshotUrl: string | null; isOwner: boolean }[] } }) {
  const card = c.author.profiles.find((p) => p.isOwner) ?? c.author.profiles[0];
  return {
    id: c.id,
    body: c.body,
    createdAt: c.createdAt,
    parentId: c.parentId,
    author: { username: c.author.username, name: c.author.name ?? card?.name ?? null, headshotUrl: c.author.avatarUrl ?? card?.headshotUrl ?? null },
  };
}

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await requireAuth();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const comments = await prisma.comment.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
    include: { author: { select: authorSelect } },
  });
  return NextResponse.json({ comments: comments.map(shape) });
}

export async function POST(request: NextRequest, { params }: Params) {
  const session = await requireAuth();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const { body, parentId } = (await request.json().catch(() => ({}))) as { body?: string; parentId?: string };
  if (!body?.trim()) return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });

  const post = await prisma.post.findUnique({ where: { id }, select: { id: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let parent: string | null = null;
  if (parentId) {
    const p = await prisma.comment.findUnique({ where: { id: parentId }, select: { postId: true, parentId: true } });
    if (!p || p.postId !== id) return NextResponse.json({ error: "Invalid parent" }, { status: 400 });
    parent = p.parentId ?? parentId; // flatten replies-to-replies onto the top-level comment
  }

  const created = await prisma.comment.create({
    data: { postId: id, authorId: session.userId, parentId: parent, body: body.trim().slice(0, 2000) },
    include: { author: { select: authorSelect } },
  });
  return NextResponse.json({ comment: shape(created) }, { status: 201 });
}
