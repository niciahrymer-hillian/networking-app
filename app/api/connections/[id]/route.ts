// PATCH /api/connections/[id]
// Owner action for confirm-to-connect (Phase 2): accept or reject a pending request.
// WHY: A submission only joins the owner's network once they confirm it. This is the
//      endpoint the requests inbox calls.
// EFFECT: Sets Connection.status to "confirmed" or "declined" — but ONLY if the
//         connection belongs to a profile owned by the logged-in user. Ownership is
//         enforced inside the updateMany `where` (relation filter), so a user can
//         never act on someone else's connection: a non-owned id simply matches
//         zero rows and returns 404.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOwnerDecision } from "@/lib/connections";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = (await req.json()) as { status?: unknown };

  if (!isOwnerDecision(status)) {
    return NextResponse.json(
      { error: 'status must be "confirmed" or "declined"' },
      { status: 400 }
    );
  }

  // Ownership check lives in the where clause: the row is only updated when its
  // profile is owned by this user. count === 0 means not found or not theirs.
  const result = await prisma.connection.updateMany({
    where: { id, profile: { userId: session.userId } },
    data: { status },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "Connection not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, status });
}
