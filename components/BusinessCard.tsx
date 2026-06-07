"use client";
// PDF business card viewer with a smooth 3D flip (page 1 = front, page 2 = back).
// WHY: react-pdf renders PDFs via pdf.js in the browser. Both pages are rendered
//      as the two faces of a card that rotates in 3D on tap — a real flip rather
//      than an instant page swap.

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Load the pdf.js worker from the CDN matching the installed version
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface BusinessCardProps {
  pdfUrl: string;
}

const face =
  "rounded-xl overflow-hidden shadow-lg ring-1 ring-black/10 [backface-visibility:hidden]";

export default function BusinessCard({ pdfUrl }: BusinessCardProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [flipped, setFlipped] = useState(false);

  const hasTwoSides = numPages >= 2;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="[perspective:1400px]">
        <div
          className={`relative transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [transform-style:preserve-3d] ${
            hasTwoSides ? "cursor-pointer select-none" : ""
          }`}
          style={{ transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
          onClick={() => hasTwoSides && setFlipped((f) => !f)}
          title={hasTwoSides ? "Click to flip" : undefined}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            loading={<div className="w-80 h-48 bg-slate-100 animate-pulse rounded-xl" />}
          >
            {/* Front — page 1 */}
            <div className={face}>
              <Page pageNumber={1} width={320} renderAnnotationLayer={false} renderTextLayer={false} />
            </div>

            {/* Back — page 2, pre-rotated so it faces forward once flipped */}
            {hasTwoSides && (
              <div className={`absolute inset-0 ${face} [transform:rotateY(180deg)]`}>
                <Page pageNumber={2} width={320} renderAnnotationLayer={false} renderTextLayer={false} />
              </div>
            )}
          </Document>
        </div>
      </div>

      {hasTwoSides && (
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
        >
          {flipped ? "← Show front" : "Flip to back ⟳"}
        </button>
      )}
    </div>
  );
}
