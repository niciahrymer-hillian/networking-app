"use client";
// Presentational QR renderer — draws a QR code into a <canvas>, no controls.
// WHY: Used for the decorative QR previews on the landing page. Rendering
// client-side with the `qrcode` lib removes the dependency on the third-party
// api.qrserver.com image service, which could fail to load (showing a broken
// "failed to load" QR). For the downloadable QR with a button, see QRCodeDisplay.

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export default function QRCanvas({
  url,
  size = 140,
  className,
}: {
  url: string;     // The full URL the QR code should point to
  size?: number;   // Canvas resolution in px (CSS can scale it down)
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: size,
        margin: 1,
        color: { dark: "#1e1b4b", light: "#ffffff" },
      });
    }
  }, [url, size]);

  return <canvas ref={canvasRef} className={className} />;
}
