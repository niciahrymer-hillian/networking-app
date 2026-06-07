// New profile page — wraps the shared ProfileForm with an empty initial state.

import Link from "next/link";
import ProfileForm from "@/components/ProfileForm";

export default function NewProfilePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f0faf5] via-white to-[#eef7f1] dark:from-[#0b1220] dark:via-[#0b1220] dark:to-[#0b1220] text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <Link href="/dashboard" className="text-sm text-emerald-700 dark:text-emerald-300 hover:text-emerald-600 transition-colors">
          ← Dashboard
        </Link>
        <div className="mt-4 mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Create your card</h1>
          <p className="mt-1 text-sm text-muted">
            Fill it in — the live preview on the right updates as you go.
          </p>
        </div>

        <ProfileForm />
      </div>
    </main>
  );
}
