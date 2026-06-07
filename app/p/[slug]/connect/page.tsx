// /p/[slug]/connect — Public connection capture page (server component shell).
// WHY: Server component fetches the profile so we can show the person's name
//      and pass the profileId to the client form without exposing internals.

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import ConnectForm from "./ConnectForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ConnectPage({ params }: Props) {
  const { slug } = await params;
  const profile = await prisma.profile.findUnique({ where: { slug } });

  if (!profile) notFound();

  const firstName = profile.name.split(" ")[0];
  const session = await getSession();

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f0faf5] via-white to-[#eef7f1] flex items-start justify-center pt-12 px-4">
      <div className="bg-white rounded-3xl shadow-xl shadow-emerald-900/5 ring-1 ring-emerald-900/5 w-full max-w-md p-8">
        {/* Greeting */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3"><span className="inline-block animate-wave">👋</span></div>
          <h1 className="text-2xl font-bold text-slate-900">
            Nice to meet you!
          </h1>
          <p className="mt-2 text-slate-500">
            Share your details so {firstName} can follow up.
          </p>
        </div>

        <ConnectForm
          profileId={profile.id}
          profileName={firstName}
          ownerUserId={profile.userId}
          viewerLoggedIn={session.isLoggedIn ?? false}
          viewerIsOwner={!!session.userId && session.userId === profile.userId}
        />
      </div>
    </main>
  );
}
