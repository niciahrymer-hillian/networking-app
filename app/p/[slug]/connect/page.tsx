// /p/[slug]/connect — Public connection capture page (server component shell).
// WHY: Server component fetches the profile so we can show the person's name
//      and pass the profileId to the client form without exposing internals.

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ConnectForm from "./ConnectForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ConnectPage({ params }: Props) {
  const { slug } = await params;
  const profile = await prisma.profile.findUnique({ where: { slug } });

  if (!profile) notFound();

  const firstName = profile.name.split(" ")[0];

  return (
    <main className="min-h-screen bg-gray-50 flex items-start justify-center pt-12 px-4">
      <div className="bg-white rounded-2xl shadow-sm border w-full max-w-md p-8">
        {/* Greeting */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">👋</div>
          <h1 className="text-2xl font-bold text-gray-900">
            Nice to meet you!
          </h1>
          <p className="mt-2 text-gray-600">
            Share your details so {firstName} can follow up.
          </p>
        </div>

        <ConnectForm profileId={profile.id} profileName={firstName} />
      </div>
    </main>
  );
}
