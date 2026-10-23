"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { Play } from "lucide-react";
import { MediaFrame } from "./ui";
import { Lightbox } from "./Gallery";
import type { GalleryCategory, GalleryItem } from "@/lib/types";

/**
 * An endless strip of photos in the style of an architecture studio's project rail:
 * same-width frames, alternating tall and short, bottom-aligned, with a plain
 * uppercase caption under each. It glides on its own forever and follows the page —
 * scroll down and it runs left, scroll up and it runs right (looping from both ends).
 * Hover slows it; tap any photo to open it full screen.
 */
export function GalleryMarquee({ items, categories }: { items: GalleryItem[]; categories: { id: GalleryCategory; label: string }[] }) {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const catLabels = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.label])), [categories]);

  // One set long enough to cover very wide screens; it's rendered twice for a seamless loop.
  const set = useMemo(() => {
    if (!items.length) return [];
    const out: GalleryItem[] = [];
    while (out.length < 12) out.push(...items);
    return out;
  }, [items]);

  const close = useCallback(() => setOpen(null), []);
  const nav = useCallback((d: 1 | -1) => setOpen((i) => (i === null ? i : (i + d + items.length) % items.length)), [items.length]);

  useGSAP((_ctx, contextSafe) => {
    const el = root.current, strip = track.current;
    if (!el || !strip || !set.length) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const setX = gsap.quickSetter(strip, "x", "px");
      // Exact loop length = distance from the first frame to its copy in the second set.
      const period = () => { const k = strip.children; return (k[set.length] as HTMLElement).offsetLeft - (k[0] as HTMLElement).offsetLeft || strip.scrollWidth / 2; };
      let half = period();
      let x = 0;
      let dir = -1;              // -1 = moving left, 1 = moving right
      const state = { speed: 1, hover: 1 };
      const BASE = 38;           // px per second
      const tick = (_t: number, dt: number) => {
        x += dir * BASE * state.speed * state.hover * (dt / 1000);
        x = gsap.utils.wrap(-half, 0, x);
        setX(x);
      };
      // The loop only runs while the strip is on screen.
      let running = false;
      const run = (on: boolean) => { if (on === running) return; running = on; if (on) gsap.ticker.add(tick); else gsap.ticker.remove(tick); };
      const onResize = () => { half = period(); };
      window.addEventListener("resize", onResize);

      // Page scroll steers the strip: direction follows the scroll, speed follows how fast.
      const st = ScrollTrigger.create({
        trigger: el, start: "top bottom", end: "bottom top",
        onToggle: (self) => run(self.isActive),
        onUpdate: (self) => {
          dir = self.direction === 1 ? -1 : 1;
          gsap.to(state, { speed: gsap.utils.clamp(1, 8, 1 + Math.abs(self.getVelocity()) / 180), duration: 0.15, overwrite: true, onComplete: () => { gsap.to(state, { speed: 1, duration: 1.2, ease: "power2.out" }); } });
        },
      });

      const fine = matchMedia("(hover: hover)").matches;
      run(st.isActive);
      const slow = contextSafe!(() => fine && gsap.to(state, { hover: 0.15, duration: 0.6 }));
      const resume = contextSafe!(() => gsap.to(state, { hover: 1, duration: 0.6 }));
      strip.addEventListener("pointerenter", slow);
      strip.addEventListener("pointerleave", resume);

      return () => {
        run(false);
        window.removeEventListener("resize", onResize);
        strip.removeEventListener("pointerenter", slow);
        strip.removeEventListener("pointerleave", resume);
        st.kill();
        gsap.set(strip, { clearProps: "transform" });
      };
    });
  }, { scope: root, dependencies: [set], revertOnUpdate: true });

  if (!items.length) return null;

  return (
    <section ref={root} aria-label="Photo carousel" className="relative overflow-hidden bg-white py-14 md:py-20">
      <div className="overflow-hidden motion-reduce:overflow-x-auto">
        <div ref={track} className="flex w-max items-end gap-3 pl-3 will-change-transform md:gap-4 md:pl-8">
          {[...set, ...set].map((g, i) => {
            const idx = items.indexOf(g);
            const dup = i >= set.length;
            const tall = i % 2 === 1;
            return (
              <button
                key={`${g.id}-${i}`}
                type="button"
                tabIndex={dup ? -1 : 0}
                aria-hidden={dup || undefined}
                aria-label={`Open ${g.event || g.caption}`}
                onClick={() => setOpen(idx)}
                data-cursor="View"
                className="group w-[170px] shrink-0 text-left focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-brand-500 sm:w-[220px] md:w-[280px]"
              >
                <span className={`relative block overflow-hidden bg-paper ${tall ? "h-[230px] sm:h-[300px] md:h-[380px]" : "h-[115px] sm:h-[150px] md:h-[190px]"}`}>
                  <span className="pointer-events-none block h-full w-full transition-transform duration-700 ease-out group-hover:scale-105"><MediaFrame media={g.media} /></span>
                  {g.type === "video" && <span className="pointer-events-none absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink"><Play className="h-3.5 w-3.5 fill-current" /></span>}
                </span>
                <span className="mt-3 block truncate font-display text-[13px] font-bold uppercase tracking-[0.01em] text-ink md:text-[15px]">
                  {g.event || catLabels[g.category]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {open !== null && items[open] && <Lightbox items={items} index={open} onClose={close} onNav={nav} categories={catLabels} />}
    </section>
  );
}
