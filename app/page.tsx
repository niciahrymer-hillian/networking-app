import Link from "next/link";
import LandingCarousel from "@/components/LandingCarousel";
import QRCanvas from "@/components/QRCanvas";
import { getSession } from "@/lib/auth";
import { getAppUrl } from "@/lib/app-url";
import LogoutButton from "@/app/LogoutButton";

const handshakeImages = [
  {
    src: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80",
    alt: "Business handshake",
  },
  {
    src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    alt: "Team handshake",
  },
];

const profilePreviews = [
  {
    name: "Ava Chen",
    title: "Product Designer",
    company: "Spark Labs",
    location: "New York, NY",
    email: "ava@sparklabs.com",
    headshot: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80",
    slug: "ava-chen",
  },
  {
    name: "Liam Patel",
    title: "Growth Marketing Lead",
    company: "Nexa Ventures",
    location: "San Francisco, CA",
    email: "liam@nexaventures.com",
    headshot: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=320&q=80",
    slug: "liam-patel",
  },
  {
    name: "Sofia Gomez",
    title: "Data Scientist",
    company: "Pulse Analytics",
    location: "Austin, TX",
    email: "sofia@pulseanalytics.com",
    headshot: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=320&q=80",
    slug: "sofia-gomez",
  },
];

export default async function Home() {
  const session = await getSession();
  const appUrl = await getAppUrl();

  if (session?.isLoggedIn) {
    return (
      <main className="min-h-screen bg-[#0f0f1a] text-white flex items-center justify-center px-4 py-10">
        <div className="mx-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-xl shadow-black/20">
          <p className="text-sm uppercase tracking-[0.35em] text-indigo-300 mb-2">Signed in</p>
          <h1 className="text-3xl font-semibold mb-4">@{session.username}</h1>
          <p className="text-white/60 mb-8">Your landing page shows the signed-in experience and quick access to your dashboard.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/dashboard" className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500">
              Go to Dashboard
            </Link>
            <LogoutButton />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0f0f1a] text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <LandingCarousel appUrl={appUrl} />

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-start">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.4em] text-indigo-400">Digital networking for your professional circle</p>
            <h1 className="text-5xl font-semibold leading-tight text-white">Build polished QR-ready profiles that make networking effortless.</h1>
            <p className="text-lg text-white/70 max-w-3xl">Create multiple contact profiles, control QR visibility, and share your professional story instantly with anyone you meet.</p>

            <div className="grid gap-4 text-white/70 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.35em] text-indigo-300 mb-3">Sample profile flow</p>
                <p className="text-sm">Click any preview, sign in, and see how QR-driven profiles help your networking feel smoother and more memorable.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm uppercase tracking-[0.35em] text-indigo-300 mb-3">Secure sharing</p>
                <p className="text-sm">Enable or disable QR exposure for each profile so you control who sees your information.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/login" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500">
                Sign in
              </Link>
              <Link href="/signup" className="inline-flex items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/20 hover:text-white">
                Create account
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            {handshakeImages.map((image) => (
              <img
                key={image.src}
                src={image.src}
                alt={image.alt}
                className="h-60 w-full rounded-3xl object-cover border border-white/10"
              />
            ))}
          </div>
        </div>

        <section className="mt-16 rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-xl shadow-black/10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-indigo-300">Try a sample profile</p>
              <h2 className="text-2xl font-semibold text-white">Sample profiles with QR previews</h2>
            </div>
            <p className="text-sm text-white/60 max-w-xl">
              Each preview is a clickable route to login, then the dashboard will let you explore the same profile workflow.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {profilePreviews.map((profile) => (
              <Link
                key={profile.name}
                href={`/p/${profile.slug}`}
                className="group block overflow-hidden rounded-3xl border border-white/10 bg-slate-950/80 p-5 transition hover:border-indigo-500/40"
              >
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 overflow-hidden rounded-3xl bg-white/10 border border-white/10">
                    <img src={profile.headshot} alt={profile.name} className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{profile.name}</p>
                    <p className="text-sm text-white/60">{profile.title}</p>
                    <p className="text-sm text-white/60">{profile.company}</p>
                  </div>
                </div>
                <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm uppercase tracking-[0.35em] text-indigo-300 mb-3">Preview</p>
                  <div className="space-y-2 text-sm text-white/70">
                    <p>{profile.location}</p>
                    <p>{profile.email}</p>
                  </div>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.35em] text-white/40">QR code</p>
                  <div className="h-24 w-24 rounded-3xl border border-white/10 bg-white/10 p-2">
                      <QRCanvas url={`${appUrl}/p/${profile.slug}`} size={96} className="h-full w-full" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
