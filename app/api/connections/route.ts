// POST /api/connections
// Public endpoint — called by the connection capture form after a QR scan.
// WHY: Encrypts all PII before writing to DB. emailHash enables duplicate detection
//      without ever decrypting stored data. At least one contact field is required.
// EFFECT: Creates a Connection row linked to the scanned profile.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { encrypt, hash } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { profileId, email, linkedin, github, cardFilename } = body as Record<string, string>;

  if (!profileId) {
    return NextResponse.json({ error: "profileId is required" }, { status: 400 });
  }

  // At least one contact field must be provided
  if (!email && !linkedin && !github && !cardFilename) {
    return NextResponse.json(
      { error: "Provide at least one of: email, linkedin, github, or a card photo" },
      { status: 400 }
    );
  }

  // Verify the profile exists before creating the connection
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Email deduplication — compare hashes so we never store the raw email
  if (email) {
    const emailHash = hash(email);
    const existing = await prisma.connection.findFirst({
      where: { profileId, emailHash },
    });
    if (existing) {
      // Treat as success (idempotent); don't leak that the email already exists
      return NextResponse.json({ ok: true });
    }
  }

  await prisma.connection.create({
    data: {
      profileId,
      emailEnc: email ? encrypt(email) : null,
      emailHash: email ? hash(email) : null,
      linkedinEnc: linkedin ? encrypt(linkedin) : null,
      githubEnc: github ? encrypt(github) : null,
      cardFilename: cardFilename ?? null,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
