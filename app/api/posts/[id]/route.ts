// PATCH/DELETE /api/posts/[id] — edit or remove your own post.
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await requireAuth();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json()) as { content?: string; tags?: unknown; linkUrl?: string };
  const text = (body.content ?? "").trim();
  if (text.length > 5000) {
    return NextResponse.json({ error: "Post is too long" }, { status: 400 });
  }

  // Ownership enforced in the where clause — count 0 means not found / not yours.
  const result = await prisma.post.updateMany({
    where: { id, authorId: session.userId },
    data: {
      content: text,
      linkUrl: body.linkUrl?.trim() || null,
      tags: Array.isArray(body.tags) && body.tags.length ? JSON.stringify(body.tags.slice(0, 10)) : null,
    },
  });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await requireAuth();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await prisma.post.deleteMany({ where: { id, authorId: session.userId } });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
