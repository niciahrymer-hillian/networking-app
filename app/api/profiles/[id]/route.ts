// GET    /api/profiles/:id  — fetch one profile
// PUT    /api/profiles/:id  — update a profile
// DELETE /api/profiles/:id  — remove a profile

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  if (!(await requireAuth()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const profile = await prisma.profile.findUnique({ where: { id } });
  if (!profile)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(profile);
}

export async function PUT(request: NextRequest, { params }: Params) {
  if (!(await requireAuth()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  if (!body.name?.trim())
    return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const profile = await prisma.profile.update({
    where: { id },
    data: {
      name: body.name.trim(),
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      headline: body.headline?.trim() || null,
      about: body.about?.trim() || null,
      headshotUrl: body.headshotUrl || null,
      pdfUrl: body.pdfUrl || null,
      linkedinUrl: body.linkedinUrl?.trim() || null,
      githubUrl: body.githubUrl?.trim() || null,
      links: body.links?.length ? JSON.stringify(body.links) : null,
    },
  });

  return NextResponse.json(profile);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await requireAuth()))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.profile.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
