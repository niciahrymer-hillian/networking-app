// AppNav — shared top navigation bar rendered on every page via layout.tsx.
// WHY: Gives users a consistent way to navigate between dashboard, profile pages,
//      and auth actions (sign in / sign up / sign out) from anywhere in the app.
// EFFECT: Server component — reads the iron-session cookie to determine auth state.
//         On desktop the links render inline; below md they collapse into <MobileMenu>.

import Link from "next/link";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import { prisma } from "@/lib/db";
import LogoutButton from "@/app/LogoutButton";
import MobileMenu, { type NavItem } from "@/components/MobileMenu";
import ThemeToggle from "@/components/ThemeToggle";
import PwaNavControls from "@/components/PwaNavControls";

export default async function AppNav() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const loggedIn = session.isLoggedIn ?? false;
  const isAdmin = session.isAdmin ?? false;
  const username = session.username;
  const me = session.userId;

  // Notification badge counts (logged-in only): pending requests, unread messages,
  // and new feed posts since the user last opened each area.
  let pendingRequests = 0;
  let unreadMessages = 0;
  let newPosts = 0;
  if (loggedIn && me) {
    const [pending, myParts, net, user] = await Promise.all([
      prisma.connection.count({ where: { profile: { userId: me }, status: "pending" } }),
      prisma.conversationParticipant.findMany({
        where: { userId: me },
        select: {
          lastReadAt: true,
          conversation: { select: { messages: { orderBy: { createdAt: "desc" }, take: 1, select: { senderId: true, createdAt: true } } } },
        },
      }),
      prisma.userConnection.findMany({ where: { userId: me }, select: { connectedUserId: true } }),
      prisma.user.findUnique({ where: { id: me }, select: { feedLastSeenAt: true } }),
    ]);
    pendingRequests = pending;
    unreadMessages = myParts.filter((p) => {
      const last = p.conversation.messages[0];
      return last && last.senderId !== me && (!p.lastReadAt || last.createdAt > p.lastReadAt);
    }).length;
    const netIds = net.map((n) => n.connectedUserId);
    newPosts = netIds.length
      ? await prisma.post.count({
          where: { authorId: { in: netIds }, ...(user?.feedLastSeenAt ? { createdAt: { gt: user.feedLastSeenAt } } : {}) },
        })
      : 0;
  }

  // Single source of truth for the nav links, used by both desktop + mobile.
  const links: NavItem[] = loggedIn
    ? [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Feed", href: "/feed", badge: newPosts },
        { label: "Messages", href: "/messages", badge: unreadMessages },
        ...(!isAdmin ? [{ label: "My profile", href: "/my-profile" }] : []),
        { label: "Connections", href: "/my-connections", badge: pendingRequests },
        { label: "Activity", href: "/notifications" },
        ...(isAdmin
          ? [
              { label: "+ Add profile", href: "/profiles/new" },
              { label: "Admin · Profiles", href: "/admin/profiles", admin: true },
              { label: "Admin · Users", href: "/admin/users", admin: true },
            ]
          : [{ label: "+ Add card", href: "/profiles/new" }]),
      ]
    : [];

  const mainLinks = links.filter((l) => !l.admin);
  const adminLinks = links.filter((l) => l.admin);

  const navLink =
    "text-sm text-muted hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 px-3 py-1.5 rounded-lg transition-colors";
  const adminLinkCls =
    "text-sm text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-500/10 px-3 py-1.5 rounded-lg transition-colors";

  return (
    <nav className="bg-surface/80 backdrop-blur-md border-b border-line px-6 pt-12 pb-8 sticky top-0 z-50">
      <div className="w-full flex items-center justify-between gap-4">

        {/* Back / forward / reload — only visible when running as an installed PWA */}
        <PwaNavControls />

        {/* Brand — pinned to the left corner */}
        <Link
          href="/"
          className="flex items-center gap-3 font-bold text-foreground hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors shrink-0"
        >
          <img src="/logo.png" alt="Networking Cards" className="h-16 w-auto rounded-md" />
          <span className="hidden sm:inline text-xl tracking-tight">Networking Cards</span>
        </Link>

        {/* Desktop centre links — roomier spacing */}
        {loggedIn && (
          <div className="hidden md:flex items-center gap-3 flex-1 justify-center">
            {mainLinks.map((l) => (
              <Link key={l.href} href={l.href} className={`${navLink} inline-flex items-center gap-1.5`}>
                {l.label}
                {l.badge ? <Bubble n={l.badge} /> : null}
              </Link>
            ))}
            {adminLinks.length > 0 && <span className="mx-1 h-4 w-px bg-line" aria-hidden />}
            {adminLinks.map((l) => (
              <Link key={l.href} href={l.href} className={adminLinkCls}>
                {l.label}
              </Link>
            ))}
          </div>
        )}

        {/* Desktop auth actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <Link href="/faqs" className={navLink} title="Help &amp; FAQs">
            FAQs
          </Link>
          {loggedIn ? (
            <>
              {username && (
                <span className="text-xs text-muted font-mono">@{username}</span>
              )}
              <Link href="/account" className={navLink} title="Account settings">
                ⚙︎
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-body hover:text-foreground transition-colors px-3 py-1.5"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-1.5 rounded-xl transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Theme toggle — always visible (mobile + desktop) */}
        <ThemeToggle />

        {/* Mobile menu (below md) */}
        <MobileMenu links={links} loggedIn={loggedIn} username={username} />
      </div>
    </nav>
  );
}

// Small emerald count bubble for nav notification badges (caps at "9+").
function Bubble({ n }: { n: number }) {
  return (
    <span className="inline-flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-bold leading-none text-white">
      {n > 9 ? "9+" : n}
    </span>
  );
}
