// iron-session v8 config — defines the cookie name, encryption key, and security options.
// WHY: Centralising session options here means all routes use the same cookie name and secret.
// EFFECT: Changing SESSION_SECRET invalidates all existing sessions (forces re-login).

import { SessionOptions } from "iron-session";

export interface SessionData {
  isLoggedIn: boolean;
  userId?: string;    // DB User.id of the logged-in account
  username?: string;  // for display in the UI
}

export const sessionOptions: SessionOptions = {
  // Session secret must be at least 32 chars — set in .env.local
  password: process.env.SESSION_SECRET!,
  cookieName: "net-session",
  cookieOptions: {
    // Only send over HTTPS in production — prevents cookie theft over plain HTTP
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};
