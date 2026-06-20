// /faqs — public FAQ page. Leads with "install the app" (PWA) instructions since
// that's the most-asked how-to, then general questions about cards/QR/privacy.
import type { Metadata } from "next";
import Link from "next/link";
import InstallButton from "@/components/InstallButton";

export const metadata: Metadata = {
  title: "FAQs · Networking Cards",
  description: "How to install the app, share your card, connect, and keep your info private.",
};

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "What is Networking Cards?",
    a: "Your digital networking card. Build a profile card, share it instantly by QR code, and stay connected with the people you meet — their updates show up in your feed.",
  },
  {
    q: "How do I create my card?",
    a: (
      <>
        Sign up, then open <Link href="/profiles/new" className="text-emerald-700 dark:text-emerald-300 underline">Add card</Link>.
        Add your name, headline, photo and links, pick a style, and save — a live preview updates as you go.
      </>
    ),
  },
  {
    q: "How do I share my card?",
    a: "Every card has its own QR code and link. Let someone scan your QR (or send the link) and they land on your card, where they can save your details or connect with you.",
  },
  {
    q: "How do connections work?",
    a: "When you connect with someone, you join each other's network and see each other's posts in your feed. You can message anyone you're connected with.",
  },
  {
    q: "Is my information private?",
    a: "Yes. Your password is encrypted and never readable by anyone — including us — and your email is stored encrypted at rest. We never sell or share your data. Private business-card photos are only ever shown to you.",
  },
];

export default function FaqsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Help &amp; FAQs</h1>
        <p className="mt-2 text-muted">Everything you need to get set up and stay connected.</p>

        {/* === Install the app (PWA) === */}
        <section className="mt-8 rounded-2xl bg-surface ring-1 ring-line p-6 shadow-sm">
          <h2 className="text-xl font-semibold flex items-center gap-2">📲 Install the app on your phone</h2>
          <p className="mt-2 text-sm text-body">
            Networking Cards installs straight from your browser — no app store needed. You get an
            app icon on your home screen that opens full-screen, just like a native app.
          </p>

          <div className="mt-4">
            {/* One-tap install on Android / desktop Chrome; hidden on iOS (use steps below). */}
            <InstallButton />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Platform title="iPhone / iPad (Safari)" steps={[
              <>Tap the Share button {ShareIcon} in the toolbar.</>,
              <>Scroll down and tap {PlusBoxIcon} “Add to Home Screen.”</>,
              <>Tap “Add” — the icon appears on your home screen.</>,
            ]} />
            <Platform title="Android (Chrome)" steps={[
              <>Tap “Install the app” above, or the menu {KebabIcon}.</>,
              <>Tap {InstallIcon} “Install app” / “Add to Home screen.”</>,
              <>Confirm — it lands in your app drawer.</>,
            ]} />
            <Platform title="Mac (Safari)" steps={[
              <>In the menu bar, open <strong>File</strong> — or tap the Share button {ShareIcon}.</>,
              <>Choose {PlusBoxIcon} “Add to Dock…,” then click “Add.”</>,
              <>It appears in your Dock and opens in its own window.</>,
            ]} />
            <Platform title="Mac / PC (Chrome · Edge)" steps={[
              <>Click {InstallIcon} in the address bar, or the menu {KebabIcon}.</>,
              <>Choose “Install Networking Cards.”</>,
              <>It opens in its own window.</>,
            ]} />
          </div>
        </section>

        {/* === General FAQs === */}
        <section className="mt-8 space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="group rounded-2xl bg-surface ring-1 ring-line p-5 shadow-sm">
              <summary className="cursor-pointer list-none font-semibold flex items-center justify-between gap-3">
                {f.q}
                <span className="text-muted transition-transform group-open:rotate-45 text-xl leading-none">+</span>
              </summary>
              <div className="mt-3 text-sm text-body leading-relaxed">{f.a}</div>
            </details>
          ))}
        </section>

        <p className="mt-8 text-sm text-muted">
          Still stuck? <Link href="/login" className="text-emerald-700 dark:text-emerald-300 underline">Sign in</Link> and reach out from your dashboard.
        </p>
      </div>
    </main>
  );
}

function Platform({ title, steps }: { title: string; steps: React.ReactNode[] }) {
  return (
    <div className="rounded-xl bg-elevated ring-1 ring-line p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <ol className="mt-2 space-y-2 text-xs text-body list-decimal list-outside ml-4 marker:text-emerald-600">
        {steps.map((s, i) => <li key={i} className="pl-1">{s}</li>)}
      </ol>
    </div>
  );
}

// Inline button glyphs so users can recognize the actual buttons they're looking for.
// `g` = an emerald rounded chip wrapper that mimics how the button looks in the OS UI.
function g(children: React.ReactNode) {
  return (
    <span className="inline-flex items-center justify-center align-middle mx-0.5 h-5 w-5 rounded-md bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-600/20">
      {children}
    </span>
  );
}
const svg = "h-3.5 w-3.5";
// iOS Share: arrow rising out of a tray.
const ShareIcon = g(
  <svg viewBox="0 0 24 24" className={svg} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3v11" /><path d="M8 7l4-4 4 4" /><path d="M6 12v7a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-7" />
  </svg>
);
// Add to Home Screen: plus in a square.
const PlusBoxIcon = g(
  <svg viewBox="0 0 24 24" className={svg} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" /><path d="M12 8v8M8 12h8" />
  </svg>
);
// Chrome/Android overflow menu: three vertical dots.
const KebabIcon = g(
  <svg viewBox="0 0 24 24" className={svg} fill="currentColor" aria-hidden>
    <circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" />
  </svg>
);
// Install: arrow descending into a tray (address-bar / menu install glyph).
const InstallIcon = g(
  <svg viewBox="0 0 24 24" className={svg} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3v10" /><path d="M8 9l4 4 4-4" /><path d="M6 17v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" />
  </svg>
);
