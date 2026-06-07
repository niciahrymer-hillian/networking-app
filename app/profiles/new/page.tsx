// New profile page — wraps the shared ProfileForm with an empty initial state.

import Link from "next/link";
import ProfileForm from "@/components/ProfileForm";

export default function NewProfilePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f0faf5] via-white to-[#eef7f1] text-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Link href="/dashboard" className="text-sm text-emerald-700 hover:text-emerald-600 transition-colors">
          ← Dashboard
        </Link>
        <div className="mt-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Create your card</h1>
          <p className="mt-1 text-sm text-slate-500">
            Add your details — this is what people see when they scan your QR code.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-emerald-900/5">
          <ProfileForm />
        </div>
      </div>
    </main>
  );
}
