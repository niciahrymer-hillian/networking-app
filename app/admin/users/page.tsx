import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import AdminUserManagement from "@/components/AdminUserManagement";

export default async function AdminUsersPage() {
  const session = await requireAdmin();
  if (!session) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">Unauthorized</h1>
          <p className="text-muted">You must be an administrator to view this page.</p>
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
    <main className="min-h-screen bg-background text-foreground p-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl bg-surface ring-1 ring-line shadow-sm p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.3em] mb-2">Administrator</p>
              <h1 className="text-3xl font-bold">User management</h1>
              <p className="text-sm text-muted mt-2">
                Reset passwords and manage account access for all users in the database.
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
              Signed in as <span className="font-medium text-emerald-900">{session.username}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-surface ring-1 ring-line shadow-sm p-6">
          <AdminUserManagement users={users} />
        </div>
      </div>
    </main>
  );
}
