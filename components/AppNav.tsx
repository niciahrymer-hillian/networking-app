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

export default async function AppNav() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const loggedIn = session.isLoggedIn ?? false;
  const isAdmin = session.isAdmin ?? false;
  const username = session.username;

  // Single source of truth for the nav links, used by both desktop + mobile.
  const links: NavItem[] = loggedIn
    ? [
        { label: "Dashboard", href: "/dashboard" },
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
    "text-sm text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors";
  const adminLinkCls =
    "text-sm text-violet-700 hover:bg-violet-50 px-3 py-1.5 rounded-lg transition-colors";

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-emerald-900/5 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">

        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 font-bold text-slate-900 hover:text-emerald-700 transition-colors shrink-0"
        >
          <img src="/logo.png" alt="Networking Cards" className="h-10 w-auto rounded-md" />
          <span className="hidden sm:inline text-sm tracking-tight">Networking Cards</span>
        </Link>

        {/* Desktop centre links */}
        {loggedIn && (
          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {mainLinks.map((l) => (
              <Link key={l.href} href={l.href} className={navLink}>
                {l.label}
              </Link>
            ))}
            {adminLinks.length > 0 && <span className="mx-1 h-4 w-px bg-slate-200" aria-hidden />}
            {adminLinks.map((l) => (
              <Link key={l.href} href={l.href} className={adminLinkCls}>
                {l.label}
              </Link>
            ))}
          </div>
        )}

        {/* Desktop auth actions */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {loggedIn ? (
            <>
              {username && (
                <span className="text-xs text-slate-400 font-mono">@{username}</span>
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
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors px-3 py-1.5"
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

        {/* Mobile menu (below md) */}
        <MobileMenu links={links} loggedIn={loggedIn} username={username} />
      </div>
    </nav>
  );
}
