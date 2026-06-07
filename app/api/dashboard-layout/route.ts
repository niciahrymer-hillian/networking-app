// PATCH /api/dashboard-layout — save the order of the user's dashboard tiles.
// Body: { order: string[] } where each id is "widget:<key>" or "card:<profileId>".
// WHY: Drag-and-drop reordering persists per-user so the layout follows them
//      across devices. Stored as a JSON string on User.dashboardLayout.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const session = await requireAuth();
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { order } = (await req.json().catch(() => ({}))) as { order?: unknown };
  if (!Array.isArray(order) || !order.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "order must be an array of strings" }, { status: 400 });
  }

  // Cap the stored list defensively (ids are short; a normal dashboard is tiny).
  const clean = (order as string[]).slice(0, 200);

  await prisma.user.update({
    where: { id: session.userId },
    data: { dashboardLayout: JSON.stringify(clean) },
  });

  return NextResponse.json({ ok: true });
}
