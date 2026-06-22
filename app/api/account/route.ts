// PATCH /api/account — update account-level identity (display name + avatar).
//
// RULE (identity propagation): the account's full name is the single source of
// truth for a person's name. When it changes we ALSO rewrite the name on every
// card they own (Profile.name), so the change flows through to their profile
// cards, business card, and QR landing page (/p/<slug> renders Profile.name).
// Feed/comments already read User.name live, so connections see it immediately.
// See references/identity-name-propagation.md.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

const parse = <T>(s: string | null): T[] => { try { const v = JSON.parse(s ?? "[]"); return Array.isArray(v) ? v : []; } catch { return []; } };

export async function GET() {
  const session = await requireAuth();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const u = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, avatarUrl: true, username: true, experience: true, education: true, skills: true, openToWork: true },
  });
  return NextResponse.json({
    name: u?.name ?? null,
    avatarUrl: u?.avatarUrl ?? null,
    username: u?.username ?? null,
    experience: parse(u?.experience ?? null),
    education: parse(u?.education ?? null),
    skills: parse<string>(u?.skills ?? null),
    openToWork: u?.openToWork ?? false,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await requireAuth();
  if (!session?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    name?: string; avatarUrl?: string; openToWork?: boolean;
    experience?: { role?: string; org?: string; period?: string; summary?: string }[];
    education?: { school?: string; credential?: string; period?: string }[];
    skills?: string[];
  };
  const { name, avatarUrl } = body;
  const cleanName = typeof name === "string" ? name.trim().slice(0, 80) : undefined;
  const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

  // Normalize structured résumé inputs → JSON strings (drop empty rows; cap counts).
  const experience = Array.isArray(body.experience)
    ? JSON.stringify(body.experience.map((e) => ({ role: str(e.role, 100), org: str(e.org, 100), period: str(e.period, 40), summary: str(e.summary, 500) })).filter((e) => e.role || e.org).slice(0, 20))
    : undefined;
  const education = Array.isArray(body.education)
    ? JSON.stringify(body.education.map((e) => ({ school: str(e.school, 120), credential: str(e.credential, 120), period: str(e.period, 40) })).filter((e) => e.school || e.credential).slice(0, 20))
    : undefined;
  const skills = Array.isArray(body.skills)
    ? JSON.stringify([...new Set(body.skills.map((s) => str(s, 40)).filter(Boolean))].slice(0, 40))
    : undefined;

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      name: cleanName === undefined ? undefined : cleanName || null,
      avatarUrl: typeof avatarUrl === "string" ? avatarUrl.trim() || null : undefined,
      experience,
      education,
      skills,
      openToWork: typeof body.openToWork === "boolean" ? body.openToWork : undefined,
    },
  });

  // Propagate the full name onto the user's cards so the business card + QR
  // landing page reflect it. Only when a non-empty name was provided — clearing
  // the account name should not blank out the cards (Profile.name is required).
  if (cleanName) {
    await prisma.profile.updateMany({
      where: { userId: session.userId },
      data: { name: cleanName },
    });
  }

  return NextResponse.json({ ok: true });
}
