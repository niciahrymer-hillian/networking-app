// PATCH /api/profiles/[id]/share-qr
// Toggles whether this card's QR may be shared by the owner's connections
// from the owner's member profile (/u/[username]).
// WHY: Owner-controlled, per-card privacy switch. Mirrors the set-owner toggle.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAuth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { allow } = (await req.json()) as { allow?: boolean };

  // Ownership enforced in the where clause — count 0 means not found / not yours.
  const result = await prisma.profile.updateMany({
    where: { id, userId: session.userId },
    data: { allowConnectionQrShare: !!allow },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, allowConnectionQrShare: !!allow });
}
