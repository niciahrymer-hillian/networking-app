import Link from "next/link";
import QRCanvas from "@/components/QRCanvas";
import { getSession } from "@/lib/auth";
import { getAppUrl } from "@/lib/app-url";
import LogoutButton from "@/app/LogoutButton";

// Demo cards showcased on the landing page (seeded in prod via scripts/seed.mjs).
const samples = [
  { slug: "ava-chen", name: "Ava Chen", title: "Product Designer", company: "Spark Labs", headshot: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80" },
  { slug: "liam-patel", name: "Liam Patel", title: "Growth Lead", company: "Nexa Ventures", headshot: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=320&q=80" },
  { slug: "sofia-gomez", name: "Sofia Gomez", title: "Data Scientist", company: "Pulse Analytics", headshot: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=320&q=80" },
];

export default async function Home() {
  const session = await getSession();
  const appUrl = await getAppUrl();

  if (session?.isLoggedIn) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-[#f0faf5] via-white to-[#eef7f1] text-slate-900 flex items-center justify-center px-4 py-10">
        <div className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-8 text-center shadow-xl shadow-emerald-900/5 ring-1 ring-emerald-900/5">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-600 mb-2">Signed in</p>
          <h1 className="text-3xl font-semibold mb-4">@{session.username}</h1>
          <p className="text-slate-500 mb-8">Quick access to your dashboard and cards.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-500">
              Go to Dashboard
            </Link>
            <LogoutButton />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#f0faf5] via-white to-[#eef7f1] text-slate-900 overflow-hidden">
      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pt-12 pb-20 grid gap-14 lg:grid-cols-2 items-center">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="pointer-events-none absolute top-40 right-0 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl" />

        <div className="relative animate-fade-up">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Digital networking, reimagined</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight leading-[1.08]">
            Your whole professional self, in <span className="text-emerald-600">one tap</span>.
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-md">
            Create a beautiful digital card, share it with a QR code, and let people save your details instantly — no app required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/signup" className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all duration-300 hover:bg-emerald-500 hover:shadow-md active:scale-[0.98]">
              Create your free card
            </Link>
            <Link href="/p/ava-chen" className="inline-flex items-center justify-center rounded-2xl border border-emerald-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:border-emerald-300 hover:bg-emerald-50">
              See a live demo →
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-400">No download. Works on every phone.</p>
        </div>

        {/* Floating mock card + QR badge */}
        <div className="relative flex justify-center lg:justify-end animate-fade-up [animation-delay:120ms]">
          <div className="relative">
            <div className="absolute -right-8 top-4 rotate-6 opacity-70 hidden sm:block">
              <MiniCard {...samples[1]} />
            </div>
            <div className="relative animate-floaty">
              <MiniCard {...samples[0]} />
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-white p-2.5 shadow-xl ring-1 ring-emerald-900/5">
              <QRCanvas url={`${appUrl}/p/ava-chen`} size={76} className="h-16 w-16" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { emoji: "🪪", title: "Create your card", desc: "Add your photo, role, links, and contact details in minutes." },
            { emoji: "📱", title: "Share by QR", desc: "Show your QR — anyone scans it to open your card, no app needed." },
            { emoji: "🤝", title: "Connect instantly", desc: "They save your contact in one tap and send theirs back to you." },
          ].map((f, i) => (
            <div
              key={f.title}
              className="animate-fade-up rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-900/5"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="text-3xl">{f.emoji}</div>
              <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live sample cards */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">Try a live card</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">Tap any card to open it</h2>
        </div>
        <div className="grid gap-8 sm:grid-cols-3 justify-items-center">
          {samples.map((s, i) => (
            <Link
              key={s.slug}
              href={`/p/${s.slug}`}
              className="group animate-fade-up flex flex-col items-center gap-4 transition-transform duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <MiniCard {...s} />
              <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-emerald-900/5">
                <QRCanvas url={`${appUrl}/p/${s.slug}`} size={72} className="h-14 w-14" />
              </div>
              <span className="text-sm font-medium text-emerald-700 group-hover:text-emerald-600">Open {s.name.split(" ")[0]}&apos;s card →</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-[2rem] bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-14 text-center text-white shadow-xl shadow-emerald-900/10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Ready to make networking effortless?</h2>
          <p className="mt-3 text-white/80 max-w-md mx-auto">Your free digital card and QR code are a minute away.</p>
          <Link href="/signup" className="mt-7 inline-flex items-center justify-center rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold text-emerald-700 transition-all duration-300 hover:bg-emerald-50 active:scale-[0.98]">
            Create your free card
          </Link>
        </div>
      </section>
    </main>
  );
}

// Presentational mock card used in the hero and the sample showcase.
function MiniCard({
  name,
  title,
  company,
  headshot,
}: {
  name: string;
  title: string;
  company?: string;
  headshot: string;
}) {
  return (
    <div className="w-64 rounded-3xl bg-white shadow-xl shadow-emerald-900/10 ring-1 ring-emerald-900/5 overflow-hidden">
      <div className="h-16 bg-gradient-to-r from-emerald-500 to-teal-500" />
      <div className="px-5 pb-5 -mt-8 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={headshot} alt={name} className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow bg-white" />
        <p className="mt-2 font-bold text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">{title}{company ? ` · ${company}` : ""}</p>
        <div className="mt-3 w-full rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white">＋ Save contact</div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 w-full text-xs">
          <div className="rounded-lg border border-emerald-200 py-1.5">📞</div>
          <div className="rounded-lg border border-emerald-200 py-1.5">✉️</div>
          <div className="rounded-lg border border-emerald-200 py-1.5">🔗</div>
        </div>
      </div>
    </div>
  );
}
