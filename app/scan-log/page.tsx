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
    <main className="min-h-screen bg-[#0f0f1a] text-white px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Scan Log</h1>
        <p className="text-sm text-white/50 mb-6">Latest public profile scans across your cards.</p>

        {scans.length === 0 ? (
          <p className="text-white/50">No scans yet.</p>
        ) : (
          <div className="space-y-2">
            {scans.map((scan) => (
              <div key={scan.id} className="bg-white/5 border border-white/10 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">
                    {scan.profile.name}
                  </p>
                  <p className="text-xs text-white/50 mt-1 break-all">
                    {scan.userAgent ?? "Unknown device"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-white/50">{new Date(scan.createdAt).toLocaleString()}</p>
                  <Link href={`/profiles/${scan.profile.id}/connections`} className="text-xs text-indigo-400 hover:text-indigo-300">
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
