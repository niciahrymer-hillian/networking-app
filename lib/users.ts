// Account lookups that aren't tied to a single route. Kept here so they can be
// unit-tested in isolation and reused by admin/diagnostic surfaces.
import { prisma } from "@/lib/db";
import { readEmail } from "@/lib/user-email";

export interface UserSummary {
  id: string;
  username: string;
  name: string | null;
  email: string | null;
  createdAt: Date;
}

/** Start of the current local day (00:00:00.000). */
export function startOfToday(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns the accounts created since midnight today, newest first.
 * Useful for confirming signups are landing in the database.
 */
export async function usersCreatedToday(now: Date = new Date()): Promise<UserSummary[]> {
  const rows = await prisma.user.findMany({
    where: { createdAt: { gte: startOfToday(now) } },
    orderBy: { createdAt: "desc" },
    select: { id: true, username: true, name: true, email: true, emailEnc: true, createdAt: true },
  });
  // Email is stored encrypted — decrypt for display (falls back to legacy plaintext).
  return rows.map(({ emailEnc, ...u }) => ({ ...u, email: readEmail({ email: u.email, emailEnc }) }));
}
