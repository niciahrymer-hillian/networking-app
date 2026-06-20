// Web App Manifest — makes the app installable as a PWA ("Add to Home Screen").
// Next serves this at /manifest.webmanifest and auto-injects <link rel="manifest">.
// Icons live in /public; the maskable variant has safe-zone padding for Android.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Networking Cards",
    short_name: "Networking",
    description: "Your digital networking card — share by QR, connect, and stay in touch.",
    start_url: "/",
    scope: "/",
    display: "standalone", // launches chrome-less, like a native app
    orientation: "portrait",
    background_color: "#0b1220", // splash background — matches the icon + dark theme
    theme_color: "#059669", // emerald brand accent (status/title bar when installed)
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
