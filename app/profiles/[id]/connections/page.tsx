// Admin connections view for a profile.
// WHY: Server component that fetches decrypted connections from the admin API.
//      Requires auth — redirects to /login if not authenticated.
// EFFECT: Renders a categorized list: Email | LinkedIn | GitHub | Card Photos.

import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ConnectionsPage({ params }: Props) {
  const session = await requireAuth();
  if (!session?.userId) redirect("/login");

  const { id } = await params;
  const profile = await prisma.profile.findFirst({ where: { id, userId: session.userId } });
  if (!profile) redirect("/");

  const [raw, scanCount] = await Promise.all([
    prisma.connection.findMany({
      where: { profileId: id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.scan.count({ where: { profileId: id } }),
  ]);

  // Decrypt all fields server-side — plain text never touches the DB
  const connections = raw.map((c) => ({
    id: c.id,
    email: c.emailEnc ? decrypt(c.emailEnc) : null,
    linkedin: c.linkedinEnc ? decrypt(c.linkedinEnc) : null,
    github: c.githubEnc ? decrypt(c.githubEnc) : null,
    cardFilename: c.cardFilename,
    createdAt: c.createdAt,
  }));

  const emails = connections.filter((c) => c.email);
  const linkedins = connections.filter((c) => c.linkedin);
  const githubs = connections.filter((c) => c.github);
  const cards = connections.filter((c) => c.cardFilename);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      {/* Back link + header */}
      <div className="mb-8">
        <Link href={`/profiles/${id}/edit`} className="text-sm text-blue-600 hover:underline">
          ← Back to {profile.name}
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          Connections — {profile.name}
        </h1>
        <p className="mt-1 text-gray-500 text-sm">
          {scanCount} scan{scanCount !== 1 ? "s" : ""} &middot; {connections.length} connection{connections.length !== 1 ? "s" : ""}
          {scanCount > 0 && (
            <span className="ml-2 text-gray-400">
              ({Math.round((connections.length / scanCount) * 100)}% converted)
            </span>
          )}
        </p>
      </div>

      {connections.length === 0 && (
        <p className="text-gray-500 text-sm">No connections yet. Share the QR code!</p>
      )}

      {/* Email section */}
      {emails.length > 0 && (
        <Section title="Email" count={emails.length}>
          {emails.map((c) => (
            <Row key={c.id} label={c.email!} href={`mailto:${c.email}`} date={c.createdAt} />
          ))}
        </Section>
      )}

      {/* LinkedIn section */}
      {linkedins.length > 0 && (
        <Section title="LinkedIn" count={linkedins.length}>
          {linkedins.map((c) => (
            <Row
              key={c.id}
              label={c.linkedin!}
              href={normalizeLinkedin(c.linkedin!)}
              date={c.createdAt}
            />
          ))}
        </Section>
      )}

      {/* GitHub section */}
      {githubs.length > 0 && (
        <Section title="GitHub" count={githubs.length}>
          {githubs.map((c) => (
            <Row
              key={c.id}
              label={c.github!}
              href={normalizeGithub(c.github!)}
              date={c.createdAt}
            />
          ))}
        </Section>
      )}

      {/* Business card photos section */}
      {cards.length > 0 && (
        <Section title="Business Card Photos" count={cards.length}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {cards.map((c) => (
              <a
                key={c.id}
                href={`/api/private-files/${c.cardFilename}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block border rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/private-files/${c.cardFilename}`}
                  alt="Business card"
                  className="w-full h-28 object-cover"
                />
                <p className="text-xs text-gray-500 px-2 py-1">
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </a>
            ))}
          </div>
        </Section>
      )}
    </main>
  );
}

// --- Sub-components ---

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">
        {title} <span className="ml-1 text-gray-300">({count})</span>
      </h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({ label, href, date }: { label: string; href: string; date: Date }) {
  return (
    <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-700 hover:underline truncate max-w-xs"
      >
        {label}
      </a>
      <span className="text-xs text-gray-400 ml-4 shrink-0">
        {new Date(date).toLocaleDateString()}
      </span>
    </div>
  );
}

// Ensure LinkedIn values open as full URLs
function normalizeLinkedin(value: string) {
  if (value.startsWith("http")) return value;
  if (value.includes("linkedin.com")) return `https://${value}`;
  return `https://linkedin.com/in/${value}`;
}

function normalizeGithub(value: string) {
  if (value.startsWith("http")) return value;
  if (value.includes("github.com")) return `https://${value}`;
  return `https://github.com/${value}`;
}
