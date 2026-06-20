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

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <Platform title="iPhone / iPad (Safari)" steps={[
              "Tap the Share button (the square with an arrow).",
              "Scroll down and tap “Add to Home Screen.”",
              "Tap “Add” — the icon appears on your home screen.",
            ]} />
            <Platform title="Android (Chrome)" steps={[
              "Tap “Install the app” above, or open the ⋮ menu.",
              "Tap “Install app” / “Add to Home screen.”",
              "Confirm — it lands in your app drawer.",
            ]} />
            <Platform title="Desktop (Chrome / Edge)" steps={[
              "Click the install icon in the address bar, or the ⋮ menu.",
              "Choose “Install Networking Cards.”",
              "It opens in its own window.",
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

function Platform({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded-xl bg-elevated ring-1 ring-line p-4">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <ol className="mt-2 space-y-1.5 text-xs text-body list-decimal list-inside marker:text-emerald-600">
        {steps.map((s, i) => <li key={i}>{s}</li>)}
      </ol>
    </div>
  );
}
