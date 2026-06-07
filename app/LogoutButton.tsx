"use client";
// Logout button — calls the logout API then redirects to /login.

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-muted hover:text-foreground transition-colors"
    >
      Sign out
    </button>
  );
}
