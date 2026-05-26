import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import AdminUserManagement from "@/components/AdminUserManagement";

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  if (!session) {
    return (
      <main className="min-h-screen bg-[#0a0a14] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">Unauthorized</h1>
          <p className="text-white/60">You must be an administrator to view this page.</p>
        </div>
      </main>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { username: "asc" },
    select: {
      id: true,
      username: true,
      email: true,
      emailVerified: true,
      isAdmin: true,
      createdAt: true,
    },
  });

  return (
    <main className="min-h-screen bg-[#0a0a14] text-white p-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/50 uppercase tracking-[0.3em] mb-2">Administrator</p>
              <h1 className="text-3xl font-bold">User management</h1>
              <p className="text-sm text-white/60 mt-2">
                Reset passwords and manage account access for all users in the database.
              </p>
            </div>
            <div className="rounded-2xl bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200">
              Signed in as <span className="font-medium text-white">{session.username}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <AdminUserManagement users={users} />
        </div>
      </div>
    </main>
  );
}
