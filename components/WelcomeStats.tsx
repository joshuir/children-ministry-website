"use client";

import { useRef } from "react";
import clsx from "clsx";
import { gsap, useGSAP } from "@/lib/gsap";
import { CalendarHeart, Quote, School, Smile, Users } from "lucide-react";
import type { HomeContent } from "@/lib/types";

const looks = [
  { card: "bg-brand-500 text-white", chip: "bg-white/15 text-white", shape: "#4FA8FF", Icon: School },
  { card: "bg-sun-400 text-ink", chip: "bg-ink/10 text-ink", shape: "#FFE08A", Icon: Users },
  { card: "bg-ink text-white", chip: "bg-white/10 text-sun-300", shape: "#2563EB", Icon: Smile },
  { card: "bg-mint-100 text-ink", chip: "bg-white text-brand-600", shape: "#B9D9FF", Icon: CalendarHeart },
];
const shapes = [
  "M50 0 61 35 98 35 68 57 79 92 50 70 21 92 32 57 2 35 39 35Z", // star
  "M50 4a46 46 0 1 0 0.1 0Z",                                     // circle
  "M8 50C8 20 30 8 50 8s42 12 42 42-22 42-42 42S8 80 8 50Z",       // blob
  "M50 2 98 50 50 98 2 50Z",                                      // diamond
];

/**
 * The home page welcome letter and the four number cards.
 * They rise in with the site-wide section reveal and share the card hover system
 * (lift, soft spotlight, neighbours step back). The signature writes itself once when scrolled to.
 */
export function WelcomeStats({ welcome, stats }: { welcome: HomeContent["welcome"]; stats: HomeContent["stats"] }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const sig = root.current?.querySelector<SVGPathElement>(".ws-sig path");
    if (!sig) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const len = sig.getTotalLength();
      gsap.fromTo(sig, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut", scrollTrigger: { trigger: sig, start: "top 85%", once: true } });
    });
  }, { scope: root });

  return (
    <div ref={root} className="container grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
      <div data-reveal className="ws-letter relative rounded-[2rem] bg-white p-8 shadow-card ring-1 ring-ink/[0.07] md:p-12">
        <Quote className="h-12 w-12 text-sun-400" aria-hidden />
        <h2 id="welcome-title" data-split className="mt-4 font-display text-[calc(var(--h-scale)*clamp(2rem,4vw,3rem))] font-bold leading-[1.05] tracking-tight">{welcome.title}</h2>
        <p data-fill className="mt-5 text-xl font-semibold leading-relaxed text-ink">{welcome.body}</p>
        <div className="relative mt-8 flex items-center gap-4 pt-6">
          <span aria-hidden className="absolute left-0 top-0 h-px w-full bg-ink/[0.08]" />
          <svg viewBox="0 0 120 40" className="ws-sig h-10 w-28 text-brand-500" aria-hidden><path d="M4 28c10-18 18-22 20-10s-6 14 4 6 16-20 22-12-4 18 8 10 14-12 20-8 6 10 14 4 14-8 20-6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /></svg>
          <div><p className="font-display text-lg font-semibold">{welcome.signature}</p><p className="text-sm text-ink-mute">{welcome.role}</p></div>
        </div>
      </div>

      <div className="flex flex-col justify-center">
        <dl data-card-group className="grid grid-cols-2 gap-4">
          {stats.map((s, i) => {
            const look = looks[i % 4];
            return (
              <div key={s.label + i} data-reveal data-card className={clsx("ws-stat relative isolate min-h-[170px] cursor-default overflow-hidden rounded-[1.75rem] p-6 md:min-h-[200px] md:p-8", look.card)}>
                <span aria-hidden data-card-media className="pointer-events-none absolute -bottom-10 -right-10 -z-10 block h-36 w-36 overflow-visible md:h-44 md:w-44">
                  <svg viewBox="0 0 100 100" className="h-full w-full opacity-60"><path d={shapes[i % 4]} fill={look.shape} /></svg>
                </span>
                <span aria-hidden data-pop className={clsx("absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full md:right-6 md:top-6", look.chip)}><look.Icon className="h-5 w-5" /></span>
                <dt className="sr-only">{s.label}</dt>
                <dd data-count={s.value} className="font-display text-[calc(var(--h-scale)*clamp(2.5rem,5vw,4rem))] font-extrabold tabular-nums leading-none tracking-tight">{s.value}</dd>
                <dd className="mt-2 font-semibold opacity-80">{s.label}</dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
}
