// PATCH /api/profiles/[id]/set-parent
// WHY: Lets the edit page link/unlink a profile as a secondary card of another profile.
// EFFECT: Sets or clears Profile.parentProfileId. Requires auth.
//         Rejects self-referencing (a card can't be its own secondary).

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  // parentProfileId = null means "unlink / make this a top-level card"
  const { parentProfileId } = await req.json() as { parentProfileId: string | null };

  if (parentProfileId === id) {
    return NextResponse.json({ error: "A profile cannot be its own secondary card." }, { status: 400 });
  }

  const current = await prisma.profile.findFirst({ where: { id, userId: session.userId } });
  if (!current) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (parentProfileId) {
    const parent = await prisma.profile.findFirst({ where: { id: parentProfileId, userId: session.userId } });
    if (!parent) {
      return NextResponse.json({ error: "Parent profile not found" }, { status: 404 });
    }
  }

  try {
    await prisma.profile.update({
      where: { id },
      data: { parentProfileId: parentProfileId ?? null },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
}
