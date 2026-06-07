import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ScanLogPage() {
  const session = await requireAuth();
  if (!session?.userId) redirect("/login");

  const scans = await prisma.scan.findMany({
    where: { profile: { userId: session.userId } },
    include: { profile: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/notifications" className="text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-600">
          ← Activity
        </Link>
        <h1 className="text-2xl font-bold mb-2 mt-3">Scan Log</h1>
        <p className="text-sm text-muted mb-6">Latest public profile scans across your cards.</p>

        {scans.length === 0 ? (
          <p className="text-muted">No scans yet.</p>
        ) : (
          <div className="space-y-2">
            {scans.map((scan) => (
              <div key={scan.id} className="bg-surface ring-1 ring-line shadow-sm rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {scan.profile.name}
                  </p>
                  <p className="text-xs text-muted mt-1 break-all">
                    {scan.userAgent ?? "Unknown device"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted">{new Date(scan.createdAt).toLocaleString()}</p>
                  <Link href={`/profiles/${scan.profile.id}/connections`} className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:text-emerald-600">
                    View profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
