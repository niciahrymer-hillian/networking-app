// New profile page — wraps the shared ProfileForm with an empty initial state.

import Link from "next/link";
import ProfileForm from "@/components/ProfileForm";

export default function NewProfilePage() {
  return (
    <main className="min-h-screen bg-[#0f0f1a] text-white">
      <header className="border-b border-white/10 px-4 py-4 max-w-2xl mx-auto flex items-center gap-3">
        <Link href="/" className="text-white/40 hover:text-white/70 transition-colors text-sm">
          ← Dashboard
        </Link>
        <span className="text-white/20">/</span>
        <h1 className="text-lg font-semibold">New profile</h1>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <ProfileForm />
      </div>
    </main>
  );
}
