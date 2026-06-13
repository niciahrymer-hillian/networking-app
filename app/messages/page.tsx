// /messages — the messaging area (DMs + group conversation rooms).
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import MessagesApp from "@/components/messages/MessagesApp";

export const dynamic = "force-dynamic";

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const session = await requireAuth();
  if (!session?.userId) redirect("/login");
  const { c } = await searchParams;
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">Messages</h1>
        <MessagesApp meId={session.userId} initialConversationId={c ?? null} />
      </div>
    </main>
  );
}
