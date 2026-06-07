// Server-rendered QR code as an <img> (PNG data URL).
// WHY: The decorative QR previews on the landing page used a client <canvas>
//      (QRCanvas) that draws in useEffect — if that page failed to hydrate, the
//      canvases stayed blank. Generating the QR on the server and shipping it as
//      an <img> means it always renders, with zero client JS.
// EFFECT: async Server Component — call it from server components only.

import QRCode from "qrcode";

export default async function QRImage({
  url,
  size = 140,
  className,
}: {
  url: string; // full URL the QR encodes
  size?: number; // pixel resolution of the generated PNG (CSS can scale it)
  className?: string;
}) {
  const dataUrl = await QRCode.toDataURL(url, {
    width: size,
    margin: 1,
    color: { dark: "#064e3b", light: "#ffffff" }, // emerald-900 on white — on-brand, crisp
  });

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={dataUrl} alt="QR code" width={size} height={size} className={className} />;
}
