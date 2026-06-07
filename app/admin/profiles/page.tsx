import { requireAdmin } from "@/lib/auth";
import AdminProfilesClient from "@/components/AdminProfilesClient";

export default async function AdminProfilesPage() {
  const session = await requireAdmin();
  if (!session) {
    return (
      <main className="min-h-screen bg-[#f6fbf8] text-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold mb-3">Unauthorized</h1>
          <p className="text-slate-500">You must be an administrator to view this page.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6fbf8] text-slate-900 p-4">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl bg-white ring-1 ring-emerald-900/5 shadow-sm p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-emerald-600 uppercase tracking-[0.3em] mb-2">Administrator</p>
              <h1 className="text-3xl font-bold">Profile management</h1>
              <p className="text-sm text-slate-500 mt-2">
                View all user profiles, delete profiles, and control QR code exposure.
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Signed in as <span className="font-medium text-emerald-900">{session.username}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white ring-1 ring-emerald-900/5 shadow-sm p-6">
          <AdminProfilesClient />
        </div>
      </div>
    </main>
  );
}
