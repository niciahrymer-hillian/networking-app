"use client";
// Client-side wrapper that lazy-loads BusinessCard with SSR disabled.
// WHY: next/dynamic with ssr:false must be called inside a Client Component —
//      Server Components cannot use it directly. This wrapper is the boundary.
// EFFECT: react-pdf (which references browser-only DOMMatrix) is never evaluated
//         during server-side rendering.

import dynamic from "next/dynamic";

const BusinessCard = dynamic(() => import("@/components/BusinessCard"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-48 bg-slate-100 rounded-xl animate-pulse" />
  ),
});

export default function BusinessCardClient({ pdfUrl }: { pdfUrl: string }) {
  return <BusinessCard pdfUrl={pdfUrl} />;
}
