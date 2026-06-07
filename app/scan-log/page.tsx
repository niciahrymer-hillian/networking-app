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
    <main className="min-h-screen bg-[#f6fbf8] text-slate-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Scan Log</h1>
        <p className="text-sm text-slate-500 mb-6">Latest public profile scans across your cards.</p>

        {scans.length === 0 ? (
          <p className="text-slate-500">No scans yet.</p>
        ) : (
          <div className="space-y-2">
            {scans.map((scan) => (
              <div key={scan.id} className="bg-white ring-1 ring-emerald-900/5 shadow-sm rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {scan.profile.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 break-all">
                    {scan.userAgent ?? "Unknown device"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-400">{new Date(scan.createdAt).toLocaleString()}</p>
                  <Link href={`/profiles/${scan.profile.id}/connections`} className="text-xs font-medium text-emerald-700 hover:text-emerald-600">
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
