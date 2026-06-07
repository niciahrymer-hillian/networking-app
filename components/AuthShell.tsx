// Shared shell for the auth screens (login, signup, forgot/reset password).
// WHY: These four pages had identical structure but copy-pasted markup. Centralising
//      the layout + the input/button styles keeps them cohesive with the bright
//      Emerald brand and means one place to evolve the look.

import type { ReactNode } from "react";

// Shared field + primary-button styles — import into the form pages.
export const authInput =
  "w-full bg-surface border border-line-strong rounded-xl px-4 py-3 text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition";

export const authButton =
  "w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors";

export default function AuthShell({
  emoji,
  title,
  subtitle,
  children,
  footer,
}: {
  emoji?: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#f0faf5] via-white to-[#eef7f1] dark:from-[#0b1220] dark:via-[#0b1220] dark:to-[#0b1220] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {emoji && <p className="text-4xl mb-3">{emoji}</p>}
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-muted text-sm mt-1 leading-relaxed">{subtitle}</p>
          )}
        </div>

        <div className="bg-surface rounded-2xl p-6 shadow-xl shadow-emerald-900/5 ring-1 ring-line">
          {children}
        </div>

        {footer && <div className="text-center mt-4 text-sm text-muted">{footer}</div>}
      </div>
    </main>
  );
}
