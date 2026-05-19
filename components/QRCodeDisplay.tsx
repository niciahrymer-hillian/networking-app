"use client";
// Renders a QR code as a canvas element and provides a download button.
// WHY: qrcode runs client-side here so no API round-trip is needed for display.
// EFFECT: The QR code encodes the full public profile URL so anyone who scans it lands on the profile page.

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeDisplayProps {
  url: string;        // The full URL the QR code should point to
  profileName: string;
  actionLabel?: string;
}

export default function QRCodeDisplay({ url, profileName, actionLabel = "Download fresh QR code" }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 200,
        margin: 2,
        color: { dark: "#1e1b4b", light: "#ffffff" },
      });
    }
  }, [url]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${profileName.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded-lg shadow-md" />
      <button
        onClick={handleDownload}
        className="text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
      >
        {actionLabel}
      </button>
    </div>
  );
}
