"use client";

import { useEffect, useState } from "react";
import QR from "qrcode";

/** Generates the QR code in the browser from a configurable URL — nothing is hard-coded into the design. */
export function QRCode({ value, size = 160, label }: { value: string; size?: number; label: string }) {
  const [svg, setSvg] = useState<string>("");
  useEffect(() => {
    let alive = true;
    QR.toString(value, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0B1530", light: "#00000000" } })
      .then((s) => alive && setSvg(s))
      .catch(() => alive && setSvg(""));
    return () => { alive = false; };
  }, [value]);
  return (
    <div role="img" aria-label={label} style={{ width: size, height: size }} className="relative">
      {svg ? <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} /> : <div className="h-full w-full animate-pulse rounded-xl bg-ink/5" />}
    </div>
  );
}
