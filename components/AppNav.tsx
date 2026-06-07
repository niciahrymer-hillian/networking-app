// AppNav — shared top navigation bar rendered on every page via layout.tsx.
// WHY: Gives users a consistent way to navigate between dashboard, profile pages,
//      and auth actions (sign in / sign up / sign out) from anywhere in the app.
// EFFECT: Server component — reads the iron-session cookie to determine auth state,
//         then renders appropriate links without an extra client-side round-trip.

import Link from "next/link";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/session";
import LogoutButton from "@/app/LogoutButton";

export default async function AppNav() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  const loggedIn = session.isLoggedIn;
  const username = session.username;

  const navLink =
    "text-sm text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors";
  // Admin links get a distinct tint so it's clear they're superuser-only.
  const adminLink =
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

        {/* Centre links — only shown when logged in */}
        {loggedIn && (
          <div className="flex items-center gap-1 flex-1 justify-center">
            <Link href="/dashboard" className={navLink}>
              Dashboard
            </Link>
            {!session.isAdmin && (
              <Link href="/my-profile" className={navLink}>
                My profile
              </Link>
            )}
            <Link href="/my-connections" className={navLink}>
              Connections
            </Link>
            <Link href="/notifications" className={navLink}>
              Activity
            </Link>
            {session.isAdmin ? (
              <>
                <Link href="/profiles/new" className={navLink}>
                  + Add profile
                </Link>
                {/* Admin-only group */}
                <span className="mx-1 h-4 w-px bg-slate-200" aria-hidden />
                <Link href="/admin/profiles" className={adminLink}>
                  Admin · Profiles
                </Link>
                <Link href="/admin/users" className={adminLink}>
                  Admin · Users
                </Link>
              </>
            ) : (
              <Link href="/profiles/new" className={navLink}>
                + Add card
              </Link>
            )}
          </div>
        )}

        {/* Right — auth actions */}
        <div className="flex items-center gap-2 shrink-0">
          {loggedIn ? (
            <>
              {username && (
                <span className="hidden sm:block text-xs text-slate-400 font-mono">
                  @{username}
                </span>
              )}
              <Link
                href="/account"
                className={navLink}
                title="Account settings"
              >
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
      </div>
    </nav>
  );
}
