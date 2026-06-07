"use client";
// Mobile nav — a hamburger that opens a dropdown of the nav links + auth actions.
// WHY: the desktop inline nav has too many links to fit on a phone (this is a
//      QR app opened on phones constantly), so below md it collapses to a menu.

import Link from "next/link";
import { useState } from "react";
import LogoutButton from "@/app/LogoutButton";

export interface NavItem {
  label: string;
  href: string;
  admin?: boolean;
}

export default function MobileMenu({
  links,
  loggedIn,
  username,
}: {
  links: NavItem[];
  loggedIn: boolean;
  username?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const item = (admin?: boolean) =>
    `px-3 py-2 rounded-lg text-sm transition-colors ${
      admin ? "text-violet-700 dark:text-violet-300 hover:bg-violet-50" : "text-body hover:bg-emerald-50"
    }`;

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Menu"
        aria-expanded={open}
        className="p-2 rounded-lg text-body hover:bg-emerald-50 transition-colors"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {open ? <><path d="M6 6l12 12" /><path d="M18 6L6 18" /></> : <><path d="M3 6h18" /><path d="M3 12h18" /><path d="M3 18h18" /></>}
        </svg>
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={close} aria-hidden />
          <div className="absolute right-3 top-14 z-50 w-56 rounded-2xl bg-surface shadow-xl ring-1 ring-line p-2 flex flex-col">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={close} className={item(l.admin)}>
                {l.label}
              </Link>
            ))}

            <div className="my-1 h-px bg-elevated" />

            {loggedIn ? (
              <>
                {username && <p className="px-3 py-1 text-xs text-muted font-mono">@{username}</p>}
                <Link href="/account" onClick={close} className={item()}>
                  Account settings
                </Link>
                <div className="px-3 py-2" onClick={close}>
                  <LogoutButton />
                </div>
              </>
            ) : (
              <>
                <Link href="/login" onClick={close} className={item()}>
                  Sign in
                </Link>
                <Link href="/signup" onClick={close} className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 text-center transition-colors">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
