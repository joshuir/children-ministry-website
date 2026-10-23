import { Navigation } from "lucide-react";
import { buttonClass } from "./ui";
import { resolveMap } from "@/lib/map";

export function mapEmbedSrc(raw?: string) {
  const r = resolveMap(raw, "", 15);
  return r.kind === "search" ? null : r.src;
}

/** Map embed (custom embed link from the CMS, or a Google search embed) with a directions deep-link. */
export function Map({ query, label, embed, title, zoom }: { query: string; label: string; embed?: string; title?: string; zoom?: number }) {
  const q = encodeURIComponent(query);
  const src = resolveMap(embed, query, zoom).src;
  return (
    <div className="relative overflow-hidden rounded-4xl bg-brand-50 ring-1 ring-ink/5">
      {/* Illustrated fallback shown underneath while the map loads (or if embeds are blocked) */}
      <svg aria-hidden className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 800 460">
        <rect width="800" height="460" fill="#EEF4FF" />
        <path d="M-20 300 C 200 260, 300 360, 520 300 S 760 220, 840 260" stroke="#fff" strokeWidth="34" fill="none" />
        <path d="M380 -20 C 360 140, 440 240, 400 480" stroke="#fff" strokeWidth="26" fill="none" />
        <path d="M-20 120 L 840 170" stroke="#fff" strokeWidth="16" fill="none" />
        <rect x="560" y="40" width="160" height="90" rx="18" fill="#E3F1FF" /><rect x="60" y="340" width="200" height="90" rx="18" fill="#E3F1FF" />
        <g transform="translate(400 200)"><circle r="40" fill="#2563EB" opacity=".15" /><path d="M0 -38 c-16 0 -28 12 -28 27 c0 20 28 45 28 45 s28 -25 28 -45 c0 -15 -12 -27 -28 -27z" fill="#2563EB" /><circle cy="-12" r="10" fill="#fff" /></g>
      </svg>
      <iframe
        title={`Map showing ${label}`}
        src={src}
        className="relative block h-[380px] w-full border-0 md:h-[460px]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <div className="absolute inset-x-4 bottom-4 flex flex-col gap-3 rounded-3xl bg-white/95 p-4 shadow-lift backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          {title && <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-brand-600">{title}</p>}
          <p className="font-display text-lg font-extrabold text-ink">{label}</p>
          <p className="text-sm text-ink-mute">{query}</p>
        </div>
        <a href={`https://www.google.com/maps/dir/?api=1&destination=${q}`} target="_blank" rel="noopener noreferrer" className={buttonClass("primary", "md")}>
          <Navigation className="h-4 w-4" /> Get Directions
        </a>
      </div>
    </div>
  );
}
