// POST /api/posts — create a post in the connections feed.
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await requireAuth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { content } = (await req.json()) as { content?: string };
  const text = (content ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Post can't be empty" }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: "Post is too long (max 2000 chars)" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: { authorId: session.userId, content: text },
  });
  return NextResponse.json(post, { status: 201 });
}
