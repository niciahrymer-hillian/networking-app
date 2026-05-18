// PATCH /api/profiles/[id]/set-owner
// Marks one profile as the owner's personal card, clears the flag on all others.
// Also links the profile to the logged-in user's account via userId.
// WHY: Only one profile can be "my card" at a time — enforced here so the UI
//      never has to deal with multiple owners.

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { prisma } from "@/lib/db";

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Run both updates in a transaction — clear all, then set the target
  await prisma.$transaction([
    prisma.profile.updateMany({ data: { isOwner: false } }),
    prisma.profile.update({
      where: { id },
      data: {
        isOwner: true,
        // Link to the logged-in user's account if we have one
        userId: session.userId ?? null,
      },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
