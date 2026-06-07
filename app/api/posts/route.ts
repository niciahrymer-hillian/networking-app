// POST /api/posts — create a post in the connections feed.
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    content?: string;
    mediaUrl?: string;
    mediaType?: string;
    linkUrl?: string;
    tags?: unknown;
  };
  const text = (body.content ?? "").trim();
  if (!text && !body.mediaUrl && !body.linkUrl) {
    return NextResponse.json({ error: "Add some text, media, or a link" }, { status: 400 });
  }
  if (text.length > 5000) {
    return NextResponse.json({ error: "Post is too long (max 5000 chars)" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      authorId: session.userId,
      content: text,
      mediaUrl: body.mediaUrl || null,
      mediaType: ["image", "audio", "video"].includes(body.mediaType ?? "") ? body.mediaType : null,
      linkUrl: body.linkUrl?.trim() || null,
      tags: Array.isArray(body.tags) && body.tags.length ? JSON.stringify(body.tags.slice(0, 10)) : null,
    },
  });
  return NextResponse.json(post, { status: 201 });
}
