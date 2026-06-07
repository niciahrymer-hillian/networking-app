"use client";
// PDF business card viewer — renders a PDF as two "sides" (page 1 = front, page 2 = back).
// WHY: react-pdf renders PDFs via pdf.js entirely in the browser, so no server-side
//      PDF-to-image conversion is needed. The CDN worker URL keeps the bundle small.
// EFFECT: Clicking the card toggles between front and back pages.

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Load the pdf.js worker from the CDN matching the installed version
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface BusinessCardProps {
  pdfUrl: string;
}

export default function BusinessCard({ pdfUrl }: BusinessCardProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  const hasTwoSides = numPages >= 2;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Card wrapper — cursor pointer shows it's interactive when two sides exist */}
      <div
        className={`relative rounded-xl overflow-hidden shadow-lg ring-1 ring-emerald-900/10 ${hasTwoSides ? "cursor-pointer select-none" : ""}`}
        onClick={() => {
          if (hasTwoSides) setCurrentPage((p) => (p === 1 ? 2 : 1));
        }}
        title={hasTwoSides ? "Click to flip" : undefined}
      >
        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="w-80 h-48 bg-slate-100 animate-pulse rounded-xl" />
          }
        >
          <Page
            pageNumber={currentPage}
            width={320}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        </Document>

        {/* Flip hint overlay — only shown when PDF has two pages */}
        {hasTwoSides && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {currentPage === 1 ? "Front · tap to flip →" : "← Back · tap to flip"}
          </div>
        )}
      </div>

      {/* Dot indicators for front/back */}
      {hasTwoSides && (
        <div className="flex gap-1.5">
          {[1, 2].map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`w-2 h-2 rounded-full transition-colors ${currentPage === p ? "bg-emerald-500" : "bg-slate-300"}`}
              aria-label={p === 1 ? "Front" : "Back"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
