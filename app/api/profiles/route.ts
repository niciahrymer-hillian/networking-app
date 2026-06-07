// GET /api/profiles        — list all profiles (newest first)
// POST /api/profiles       — create a new profile

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { getTemplate, getColorScheme, getFont } from "@/lib/card-design";

export async function GET() {
  const session = await requireAuth();
  if (!session?.userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profiles = await prisma.profile.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(profiles);
}

export async function POST(request: NextRequest) {
  const session = await requireAuth();
  if (!session?.userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (!body.name?.trim())
    return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const profile = await prisma.profile.create({
    data: {
      slug: uuidv4(), // unique URL-safe ID for the public /p/<slug> page
      userId: session.userId,
      name: body.name.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      headline: body.headline?.trim() || null,
      about: body.about?.trim() || null,
      headshotUrl: body.headshotUrl || null,
      pdfUrl: body.pdfUrl || null,
      linkedinUrl: body.linkedinUrl?.trim() || null,
      githubUrl: body.githubUrl?.trim() || null,
      // Custom links stored as JSON string — [{label, url}, ...]
      links: body.links?.length ? JSON.stringify(body.links) : null,
      template: getTemplate(body.template),
      colorScheme: getColorScheme(body.colorScheme),
      font: getFont(body.font),
    },
  });

  return NextResponse.json(profile, { status: 201 });
}
