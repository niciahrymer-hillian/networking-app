// GET /api/network — the caller's connections (for starting DMs / adding to groups).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { convoUserSelect, displayUser } from "@/lib/conversations";

export async function GET() {
  const session = await requireAuth();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const edges = await prisma.userConnection.findMany({
    where: { userId: session.userId },
    include: { connectedUser: { select: convoUserSelect } },
    orderBy: { createdAt: "desc" },
  });
  const connections = edges.map((e) => displayUser(e.connectedUser));
  return NextResponse.json({ connections });
}
