// AppNav — shared top navigation bar rendered on every page via layout.tsx.
// WHY: Gives users a consistent way to navigate between dashboard, profile pages,
//      and auth actions (sign in / sign up / sign out) from anywhere in the app.
// EFFECT: Server component — reads the iron-session cookie to determine auth state.
//         On desktop the links render inline; below md they collapse into <MobileMenu>.

import Link from "next/link";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import LogoutButton from "@/app/LogoutButton";
import MobileMenu, { type NavItem } from "@/components/MobileMenu";
import ThemeToggle from "@/components/ThemeToggle";

export default async function AppNav() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const loggedIn = session.isLoggedIn ?? false;
  const isAdmin = session.isAdmin ?? false;
  const username = session.username;

  // Single source of truth for the nav links, used by both desktop + mobile.
  const links: NavItem[] = loggedIn
    ? [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Feed", href: "/feed" },
        { label: "Messages", href: "/messages" },
        ...(!isAdmin ? [{ label: "My profile", href: "/my-profile" }] : []),
        { label: "Connections", href: "/my-connections" },
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
              <Link key={l.href} href={l.href} className={navLink}>
                {l.label}
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
