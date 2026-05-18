// GET /api/profiles/[id]/connections
// Admin-only endpoint that returns all connections for a profile with PII decrypted.
// WHY: Decryption only happens server-side in an authenticated route — raw encrypted
//      strings are never sent to the browser.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const connections = await prisma.connection.findMany({
    where: { profileId: id },
    orderBy: { createdAt: "desc" },
  });

  // Decrypt each field before sending — encrypted strings never leave the server
  const decrypted = connections.map((c) => ({
    id: c.id,
    email: c.emailEnc ? decrypt(c.emailEnc) : null,
    linkedin: c.linkedinEnc ? decrypt(c.linkedinEnc) : null,
    github: c.githubEnc ? decrypt(c.githubEnc) : null,
    cardFilename: c.cardFilename,
    createdAt: c.createdAt,
  }));

  return NextResponse.json(decrypted);
}
