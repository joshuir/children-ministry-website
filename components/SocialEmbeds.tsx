"use client";

import { saveConsent, useConsent } from "@/lib/consent";
import { useState } from "react";
import clsx from "clsx";
import { ExternalLink, Play } from "lucide-react";
import { SocialIcon } from "./SocialLinks";
import { fmtDate } from "@/lib/format";
import type { SocialEmbed } from "@/lib/types";

/** Turns a public post URL into an embeddable iframe URL, when the platform allows it. */
export function embedUrl(e: Pick<SocialEmbed, "platform" | "url">): string | null {
  try {
    const u = new URL(e.url);
    if (e.platform === "youtube") {
      const id = u.hostname.includes("youtu.be") ? u.pathname.slice(1) : u.searchParams.get("v") || u.pathname.match(/\/(shorts|embed|live)\/([\w-]+)/)?.[2];
      return id ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1` : null;
    }
    if (e.platform === "instagram") {
      const m = u.pathname.match(/\/(p|reel|tv)\/([\w-]+)/);
      return m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed` : null;
    }
    if (e.platform === "tiktok") {
      const id = u.pathname.match(/video\/(\d+)/)?.[1];
      return id ? `https://www.tiktok.com/embed/v2/${id}` : null;
    }
    if (e.platform === "facebook") {
      const isVideo = /\/videos?\/|\/reel\/|watch/.test(u.pathname + u.search);
      return `https://www.facebook.com/plugins/${isVideo ? "video" : "post"}.php?href=${encodeURIComponent(e.url)}&show_text=true&width=500`;
    }
  } catch { /* not a URL */ }
  return null;
}

const platformName: Record<SocialEmbed["platform"], string> = { youtube: "YouTube", instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", x: "X", link: "Link" };

function guessIcon(e: SocialEmbed) {
  if (e.platform !== "link") return e.platform === "x" ? "x" : e.platform;
  const h = e.url.toLowerCase();
  return h.includes("instagram") ? "instagram" : h.includes("facebook") ? "facebook" : h.includes("tiktok") ? "tiktok" : h.includes("youtu") ? "youtube" : h.includes("x.com") || h.includes("twitter") ? "x" : "whatsapp";
}

function EmbedCard({ e }: { e: SocialEmbed }) {
  const src = embedUrl(e);
  const [load, setLoad] = useState(false);
  const consent = useConsent();
  const tall = e.platform === "instagram" || e.platform === "tiktok" || e.platform === "facebook";
  return (
    <article className="tilt-card group flex flex-col overflow-hidden rounded-4xl bg-white shadow-card ring-1 ring-ink/5">
      {src ? (
        <div className={clsx("relative w-full bg-ink", tall ? "aspect-[4/5]" : "aspect-video")}>
          {load && consent?.media ? (
            <iframe src={src} title={e.caption} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowFullScreen className="absolute inset-0 h-full w-full border-0 bg-white" />
          ) : (
            <button type="button" onClick={() => { if (!consent?.media) saveConsent({ media: true }); setLoad(true); }} className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-600 to-ink text-white" aria-label={`Load ${platformName[e.platform]} post: ${e.caption}`}>
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-ink shadow-lift transition-transform duration-200 group-hover:scale-110"><Play className="ml-1 h-7 w-7 fill-current" /></span>
              <span className="text-sm font-bold">Tap to load from {platformName[e.platform]}</span>
              {!consent?.media && <span className="max-w-[16rem] px-4 text-center text-xs text-white/75">Loading allows {platformName[e.platform]} cookies (you can change this in Cookie settings).</span>}
            </button>
          )}
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-sm font-bold text-ink-mute">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white"><SocialIcon platform={guessIcon(e) as any} className="h-4 w-4" /></span>
          {platformName[e.platform] === "Link" ? "From our socials" : platformName[e.platform]} · {fmtDate(e.date, { day: "numeric", month: "short" })}
        </div>
        <p className="flex-1 font-semibold leading-snug text-ink">{e.caption}</p>
        <a href={e.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[40px] items-center gap-2 self-start rounded-full bg-paper px-4 text-sm font-bold text-ink transition-colors duration-100 hover:bg-brand-500 hover:text-white">
          Open post <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}

export function SocialEmbeds({ items }: { items: SocialEmbed[] }) {
  if (!items.length) return null;
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.slice(0, 6).map((e) => <div key={e.id} data-reveal><EmbedCard e={e} /></div>)}
    </div>
  );
}
