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

  return (
    <nav className="bg-[#0a0a14] border-b border-white/10 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">

        {/* Brand */}
        <Link
          href={loggedIn ? "/" : "/login"}
          className="flex items-center gap-2 font-bold text-white hover:text-indigo-300 transition-colors shrink-0"
        >
          <span className="text-xl">🤝</span>
          <span className="hidden sm:inline text-sm tracking-tight">Networking Cards</span>
        </Link>

        {/* Centre links — only shown when logged in */}
        {loggedIn && (
          <div className="flex items-center gap-1 flex-1 justify-center">
            <Link
              href="/"
              className="text-sm text-white/60 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/profiles/new"
              className="text-sm text-white/60 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
            >
              + Add card
            </Link>
          </div>
        )}

        {/* Right — auth actions */}
        <div className="flex items-center gap-2 shrink-0">
          {loggedIn ? (
            <>
              {username && (
                <span className="hidden sm:block text-xs text-white/40 font-mono">
                  @{username}
                </span>
              )}
              <Link
                href="/account"
                className="text-sm text-white/60 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
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
                className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
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
