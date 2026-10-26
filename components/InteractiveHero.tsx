"use client";

import { useRef, type ReactNode } from "react";
import clsx from "clsx";
import { gsap, useGSAP, Draggable } from "@/lib/gsap";
import { MQ, heroIntro, heroMouseInteraction, heroScroll, intensity, playSafely, tierOf } from "@/lib/motion";
import { Hand } from "lucide-react";
import { MediaFrame } from "./ui";
import { whenIntroDone } from "./Intro";
import type { Media, Tone } from "@/lib/types";

const bg: Record<Tone, string> = { blue: "bg-brand-50", sun: "bg-sun-100", coral: "bg-coral-100", mint: "bg-mint-100", lilac: "bg-lilac-100", ink: "bg-ink" };
const hl: Record<Tone, string> = { blue: "text-brand-500", sun: "text-coral-600", coral: "text-brand-500", mint: "text-brand-600", lilac: "text-brand-500", ink: "text-sun-400" };
const glow: Record<Tone, string> = { blue: "rgba(37,99,235,.18)", sun: "rgba(255,197,61,.35)", coral: "rgba(255,122,89,.25)", mint: "rgba(79,168,255,.25)", lilac: "rgba(30,58,138,.15)", ink: "rgba(255,197,61,.2)" };
const stickerTone = ["bg-sun-400 text-ink", "bg-ink text-white", "bg-coral-400 text-white", "bg-white text-ink ring-2 ring-ink", "bg-brand-500 text-white", "bg-mint-400 text-ink"];
// Spots around the picture so stickers never cover the headline.
const spots = [
  { left: "-6%", top: "6%", rotate: -8 }, { left: "78%", top: "-4%", rotate: 7 }, { left: "70%", top: "86%", rotate: -5 },
  { left: "-4%", top: "78%", rotate: 6 }, { left: "84%", top: "44%", rotate: -10 }, { left: "-10%", top: "42%", rotate: 9 },
];

function splitTitle(title: string, highlight?: string) {
  const i = highlight ? title.toLowerCase().lastIndexOf(highlight.toLowerCase()) : -1;
  if (!highlight || i < 0) return { before: title, hi: "", after: "" };
  return { before: title.slice(0, i), hi: title.slice(i, i + highlight.length), after: title.slice(i + highlight.length) };
}

const words = (s: string, cls?: string) =>
  s.split(/(\s+)/).filter(Boolean).map((w, i) =>
    /^\s+$/.test(w) ? " " : <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-bottom"><span data-hero="word" className={clsx("inline-block", cls)}>{w}</span></span>,
  );

export function InteractiveHero({ eyebrow, title, highlight, body, tone = "blue", media, stickers = [], children }: {
  eyebrow: string; title: string; highlight?: string; body?: ReactNode; tone?: Tone; media?: Media; stickers?: string[]; children?: ReactNode;
}) {
  const root = useRef<HTMLElement>(null);
  const { before, hi, after } = splitTitle(title, highlight);
  const dark = tone === "ink";
  const list = stickers.filter(Boolean).slice(0, 6);

  useGSAP(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add({ desktop: MQ.desktop, tablet: MQ.tablet, mobile: MQ.mobile }, (ctx) => {
      const t = tierOf(ctx.conditions);
      if (t.reduce) {
        const intro = heroIntro(el, true);
        let stopSafety = () => {};
        const off = whenIntroDone(() => { stopSafety = playSafely(intro); });
        return () => { off(); stopSafety(); };
      }
      const intro = heroIntro(el);
      let stopSafety = () => {};
        const off = whenIntroDone(() => { stopSafety = playSafely(intro); });
      const stopMouse = t.mobile ? () => {} : heroMouseInteraction(el, intensity(t));
      heroScroll(el, t.mobile ? 0.5 : 1);
      return () => { off(); stopSafety(); stopMouse(); };
    });
    // Stickers can be picked up and flung on every device (with keyboard-free fallback: they're decorative).
    Draggable.create(el.querySelectorAll(".ph-sticker"), {
      bounds: el, inertia: true, edgeResistance: 0.75, zIndexBoost: true,
      onPress() { gsap.to(this.target, { scale: 1.08, duration: 0.2, ease: "power3.out" }); },
      onRelease() { gsap.to(this.target, { scale: 1, duration: 0.4, ease: "power3.out" }); },
    });
  }, { scope: root });

  return (
    <section ref={root} className={clsx("relative overflow-hidden pb-14 pt-28 md:pb-20 md:pt-36", bg[tone], dark && "text-white")}>
      <div aria-hidden data-hero="bg" className="pointer-events-none absolute inset-0 origin-top">
        <div data-depth="-14" className="absolute inset-0">
          {/* Plain CSS dots (an SVG <pattern> here was drawn as a black block by iOS Safari once the layer was transformed). */}
          <div className="absolute inset-0 opacity-60" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${dark ? "#3A4566" : "#B9CEFF"} 1.5px, transparent 2px)`, backgroundSize: "26px 26px" }} />
        </div>
        <div data-depth="-26" className="absolute -right-24 top-0 h-[460px] w-[460px] rounded-full" style={{ background: `radial-gradient(circle, ${glow[tone]} 0%, transparent 65%)` }} />
      </div>
      <div aria-hidden data-depth="-30" className="pointer-events-none absolute left-[6%] top-[24%] hidden md:block"><div data-hero-scroll="deco"><svg data-hero="deco" className="w-9" viewBox="0 0 20 20"><path d="M10 0C11.5 8 12 8.5 20 10C12 11.5 11.5 12 10 20C8.5 12 8 11.5 0 10C8 8.5 8.5 8 10 0Z" fill="#FFC53D" /></svg></div></div>
      <div aria-hidden data-depth="24" className="pointer-events-none absolute bottom-[10%] left-[42%] hidden md:block"><div data-hero-scroll="deco"><div data-hero="deco" className="h-6 w-6 rounded-full border-4 border-coral-400" /></div></div>

      <div className="container relative grid items-center gap-10 md:grid-cols-[1.15fr_1fr] md:gap-12">
        <div data-hero-scroll="content" className="relative z-[1]">
          <p data-hero="secondary" className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-extrabold uppercase tracking-[0.1em] text-ink shadow-card">
            <span className="h-2 w-2 rounded-full bg-brand-500" />{eyebrow}
          </p>
          <h1 className="font-display text-[calc(var(--h-scale)*clamp(2.75rem,7vw,5.5rem))] font-extrabold leading-[0.95] tracking-[-0.035em] text-balance">
            <span className="sr-only">{title}</span>
            <span aria-hidden>
              {words(before)}
              {hi && hi.split(/(\s+)/).filter(Boolean).map((w, i) =>
                /^\s+$/.test(w) ? " " : (
                  <span key={`h${i}`} className="inline-block overflow-hidden pb-[0.14em] align-bottom">
                    <span data-hero="word" className={clsx("squiggle inline-block", hl[tone])}>{w}</span>
                  </span>
                ))}
              {words(after)}
            </span>
          </h1>
          {body && <p data-hero="body" className={clsx("mt-5 max-w-lg text-lg font-semibold leading-snug md:text-xl", dark ? "text-white/80" : "text-ink-soft")}>{body}</p>}
          {children && <div data-hero="cta" className="mt-7">{children}</div>}
        </div>

        {media && (
          <div data-hero-scroll="visual" className="relative mx-auto w-full max-w-[500px] md:mx-0 md:justify-self-end">
            <div data-depth="12" className="relative">
              <div data-hero="visual" data-hero-tilt className="aspect-[16/10] overflow-hidden rounded-[2.5rem] border-[3px] border-ink bg-white shadow-[10px_10px_0_0_#0B1530] md:aspect-[4/3.4]">
                <div data-hero-scroll="media" className="h-full w-full"><MediaFrame media={media} priority /></div>
              </div>
            </div>
            {list.map((s, i) => (
              <div key={i} className="absolute" style={{ left: spots[i].left, top: spots[i].top }}>
                <div data-depth={String(24 + i * 10)}>
                  <div data-hero="deco">
                    <span data-cursor="Drag" className={clsx("ph-sticker inline-flex cursor-grab touch-none select-none items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 font-display text-[15px] font-extrabold shadow-lift active:cursor-grabbing md:text-base", stickerTone[i % stickerTone.length])} style={{ rotate: `${spots[i].rotate}deg` }}>
                      {i === 0 && <Hand aria-hidden className="h-4 w-4" />}{s}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
