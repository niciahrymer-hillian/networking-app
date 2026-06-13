// Shared helpers for the messaging API (DMs + group conversation rooms).
import { prisma } from "@/lib/db";

export const convoUserSelect = {
  id: true,
  username: true,
  profiles: {
    select: { name: true, headshotUrl: true, isOwner: true },
    orderBy: { createdAt: "asc" as const },
  },
};

type RawUser = { id: string; username: string; profiles: { name: string; headshotUrl: string | null; isOwner: boolean }[] };

export function displayUser(u: RawUser) {
  const card = u.profiles.find((p) => p.isOwner) ?? u.profiles[0];
  return { id: u.id, username: u.username, name: card?.name ?? null, headshotUrl: card?.headshotUrl ?? null };
}

// Returns the caller's participant row (incl. isAdmin) or null if not a member.
export async function participantOf(conversationId: string, userId: string) {
  return prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { isAdmin: true },
  });
}
