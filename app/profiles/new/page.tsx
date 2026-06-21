// New profile page — wraps the shared ProfileForm.
// With ?from=<parentId>, it becomes "Add a secondary card": the shared identity
// (name, email, phone, headshot, LinkedIn, GitHub) is pre-filled from the parent
// card and the new card links to it on save — only the role-specific bits (headline,
// about, links, style) start blank.

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import ProfileForm, { type ProfileFormData } from "@/components/ProfileForm";

export default async function NewProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const session = await requireAuth();
  if (!session?.userId) redirect("/login");

  // Account identity (distinct from the card name) — shown in the form as context.
  const account = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, username: true },
  });

  // "Add a secondary card" — pre-fill from the parent card (must be the user's own).
  const { from } = await searchParams;
  let initial: ProfileFormData | undefined;
  let secondaryOf: string | undefined;
  let parentName: string | undefined;
  if (from) {
    const parent = await prisma.profile.findFirst({ where: { id: from, userId: session.userId } });
    if (parent) {
      secondaryOf = parent.id;
      parentName = parent.name;
      initial = {
        // Adopted shared identity:
        name: parent.name,
        email: parent.email ?? "",
        phone: parent.phone ?? "",
        headshotUrl: parent.headshotUrl ?? "",
        linkedinUrl: parent.linkedinUrl ?? "",
        githubUrl: parent.githubUrl ?? "",
        // Role-specific — start blank for the new career:
        headline: "",
        about: "",
        pdfUrl: "",
        links: [],
        // Copy the parent's style so it looks consistent (tweak freely):
        template: parent.template,
        cardTemplate: parent.cardTemplate ?? "",
        colorScheme: parent.colorScheme,
        font: parent.font,
        // no `id` → this stays a create, not an edit
      };
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f0faf5] via-white to-[#eef7f1] dark:from-[#0b1220] dark:via-[#0b1220] dark:to-[#0b1220] text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link href="/dashboard" className="text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-600 transition-colors">
          ← Dashboard
        </Link>
        <div className="mt-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            {secondaryOf ? "Add a secondary card" : "Create your card"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {secondaryOf
              ? <>A second card for another role — your details are carried over{parentName ? <> from “{parentName}”</> : null}. Just set the new headline + style.</>
              : "Fill it in — the live preview on the right updates as you go."}
          </p>
        </div>

        <ProfileForm account={account ?? undefined} initial={initial} secondaryOf={secondaryOf} />
      </div>
    </main>
  );
}
