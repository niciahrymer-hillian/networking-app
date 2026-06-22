// /search — find people by name, @handle, headline, or skill. Optional "open to
// work" filter. Auth-gated (like the rest of the app); results show public-ish
// identity only (name / headline / avatar) and link to the full /u profile.
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; open?: string }>;
}) {
  const session = await requireAuth();
  if (!session?.userId) redirect("/login");

  const { q: rawQ, open } = await searchParams;
  const q = rawQ?.trim() ?? "";
  const openOnly = open === "1";

  const results = q || openOnly
    ? await prisma.user.findMany({
        where: {
          ...(openOnly ? { openToWork: true } : {}),
          ...(q
            ? {
                OR: [
                  { username: { contains: q } },
                  { name: { contains: q } },
                  { skills: { contains: q } },
                  { profiles: { some: { OR: [{ name: { contains: q } }, { headline: { contains: q } }] } } },
                ],
              }
            : {}),
        },
        take: 40,
        orderBy: { createdAt: "desc" },
        select: {
          username: true,
          name: true,
          avatarUrl: true,
          openToWork: true,
          profiles: { where: { isOwner: true }, take: 1, select: { name: true, headline: true, headshotUrl: true } },
        },
      })
    : [];

  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight">Find people</h1>
        <p className="mt-1 text-sm text-muted">Search by name, @handle, headline, or skill.</p>

        <form method="GET" className="mt-5 flex flex-wrap items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="e.g. product designer, react, @ava"
            autoFocus
            className="min-w-0 flex-1 rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <label className="inline-flex items-center gap-1.5 text-sm text-body">
            <input type="checkbox" name="open" value="1" defaultChecked={openOnly} className="h-4 w-4 rounded border-line-strong text-emerald-600 focus:ring-emerald-500" />
            Open to work
          </label>
          <button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-5 py-2.5 transition-colors">
            Search
          </button>
        </form>

        <div className="mt-6">
          {!q && !openOnly ? (
            <p className="text-sm text-muted">Type a name, role, or skill to get started.</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted">No people found{q ? <> for “{q}”</> : null}.</p>
          ) : (
            <ul className="space-y-2">
              {results.map((u) => {
                const card = u.profiles[0];
                const name = u.name ?? card?.name ?? `@${u.username}`;
                const avatar = u.avatarUrl ?? card?.headshotUrl ?? null;
                return (
                  <li key={u.username}>
                    <Link href={`/u/${u.username}`} className="flex items-center gap-3 rounded-xl bg-surface ring-1 ring-line px-3 py-2.5 hover:bg-elevated transition-colors">
                      {avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-line" />
                      ) : (
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 font-bold text-emerald-700 dark:text-emerald-300">
                          {name.replace(/^@/, "").charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{name}</span>
                          {u.openToWork && <span className="shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">open to work</span>}
                        </span>
                        <span className="block truncate text-xs text-muted">@{u.username}{card?.headline ? ` · ${card.headline}` : ""}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
