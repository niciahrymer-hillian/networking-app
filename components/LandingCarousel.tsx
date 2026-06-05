"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import QRCanvas from "@/components/QRCanvas";

const slides = [
  {
    slug: "ava-chen",
    name: "Ava Chen",
    title: "Product Designer",
    company: "Spark Labs",
    headshot: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80",
    screenshot: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    slug: "liam-patel",
    name: "Liam Patel",
    title: "Growth Marketing Lead",
    company: "Nexa Ventures",
    headshot: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=240&q=80",
    screenshot: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
  },
  {
    slug: "sofia-gomez",
    name: "Sofia Gomez",
    title: "Data Scientist",
    company: "Pulse Analytics",
    headshot: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=240&q=80",
    screenshot: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function LandingCarousel({ appUrl }: { appUrl: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setCurrent((value) => (value + 1) % slides.length), 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="group block w-full rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl shadow-black/30">
      <div className="relative h-[380px] md:h-[440px] w-full bg-slate-950">
        {slides.map((slide, index) => (
          <Link
            key={slide.name}
            href={`/p/${slide.slug}`}
            className={`absolute inset-0 flex items-center justify-between gap-8 px-8 py-10 transition-all duration-700 ${
              index === current ? "translate-x-0 opacity-100" : index < current ? "-translate-x-full opacity-0" : "translate-x-full opacity-0"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#02050c]/95 via-[#02050c]/08 to-[#02050c]/95" />
            <div className="relative z-10 grid flex-1 gap-6 md:grid-cols-[1.1fr_0.9fr] items-center">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-[0_32px_80px_rgba(15,23,42,0.45)]">
                <img src={slide.screenshot} alt={`${slide.name} screenshot`} className="h-full w-full object-cover" />
                <div className="absolute left-5 top-5 rounded-3xl bg-black/50 px-3 py-2 text-xs uppercase tracking-[0.35em] text-white/70">
                  Live profile screenshot
                </div>
              </div>
              <div className="grid gap-6">
                <div className="space-y-4 text-white">
                  <p className="text-sm uppercase tracking-[0.45em] text-indigo-300">Demo profile</p>
                  <h2 className="text-4xl font-semibold leading-tight">{slide.name}</h2>
                  <p className="text-lg text-white/70">{slide.title} at {slide.company}</p>
                  <p className="max-w-xl text-white/50">Click any profile to visit the public QR profile page.</p>
                </div>
                <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-slate-950/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.5)]">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-3xl border border-white/10 bg-white/10">
                      <img src={slide.headshot} alt={slide.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white">{slide.name}</p>
                      <p className="text-sm text-white/50">{slide.title}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-white/50">
                      <span>Public QR</span>
                      <span>{slide.company}</span>
                    </div>
                    <div className="flex items-center justify-center rounded-3xl bg-white/10 p-3">
                      <QRCanvas url={`${appUrl}/p/${slide.slug}`} size={128} className="h-32 w-32" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        <div className="absolute inset-x-0 bottom-5 flex justify-center gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={(event) => {
                event.preventDefault();
                setCurrent(index);
              }}
              className={`h-2.5 w-10 rounded-full transition-all ${index === current ? "bg-white" : "bg-white/20"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
