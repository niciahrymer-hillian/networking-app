import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function MyProfilePage() {
  const session = await requireAuth();
  if (!session?.userId) redirect("/login");

  const owner = await prisma.profile.findFirst({
    where: { userId: session.userId, isOwner: true },
    select: { id: true },
  });

  if (owner) {
    redirect(`/profiles/${owner.id}/edit`);
  }

  const first = await prisma.profile.findFirst({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (first) {
    redirect(`/profiles/${first.id}/edit`);
  }

  redirect("/profiles/new");
}
