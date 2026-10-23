"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { INTRO_KEY as KEY } from "@/lib/intro";

/** Runs `cb` once the intro screen has finished (or immediately if there is none). */
export function whenIntroDone(cb: () => void) {
  if (typeof document === "undefined") return () => {};
  if (!document.documentElement.classList.contains("intro-playing")) { cb(); return () => {}; }
  const on = () => cb();
  window.addEventListener("intro:done", on, { once: true });
  return () => window.removeEventListener("intro:done", on);
}

const SEQUENCE = ["Helping Children", "Love", "Trust", "Live", "Appear with God"];
const OLD_DEFAULT = "Know|Love|Live|God's Word";

/**
 * Minimal typographic loading screen (dark ambient stage, one centred line).
 * Each line types in with TextPlugin, holds, dissolves, and the next appears in the same spot.
 * The last line stays with a soft glow, then the curtain lifts to reveal the page.
 */
export function Intro({ words, tagline }: { words: string[]; tagline: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  const list = (!words.length || words.join("|") === OLD_DEFAULT ? SEQUENCE : words).slice(0, 8);

  useGSAP(() => {
    const html = document.documentElement;
    if (!html.classList.contains("intro-playing") || !root.current) { setGone(true); return; }
    const el = root.current;
    const q = gsap.utils.selector(el);
    const txt = q("[data-intro-txt]")[0] as HTMLElement;
    const caret = q("[data-intro-caret]")[0] as HTMLElement;
    const steps = q("[data-intro-step]");
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      try { sessionStorage.setItem(KEY, "1"); } catch {}
      html.classList.remove("intro-playing");
      html.classList.add("intro-skip");
      document.body.style.overflow = "";
      window.dispatchEvent(new Event("intro:done"));
      setGone(true);
    };
    document.body.style.overflow = "hidden";

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      txt.textContent = list[list.length - 1];
      gsap.set([q("[data-intro-sub]"), caret], { autoAlpha: 1 });
      gsap.set(steps, { scaleX: 1 });
      gsap.to(el, { autoAlpha: 0, duration: 0.4, delay: 1.4, onComplete: finish });
      return;
    }

    // Slow ambient breathing behind the type.
    q("[data-intro-orb]").forEach((o, i) => gsap.to(o, { xPercent: gsap.utils.random(-8, 8), yPercent: gsap.utils.random(-8, 8), scale: gsap.utils.random(0.92, 1.08), duration: 8 + i * 2, ease: "sine.inOut", repeat: -1, yoyo: true }));
    const blink = gsap.to(caret, { opacity: 0.15, duration: 0.5, ease: "steps(1)", repeat: -1, yoyo: true });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" }, onComplete: () => { blink.kill(); finish(); } });
    tl.from(q("[data-intro-meta]"), { autoAlpha: 0, y: 8, duration: 0.6, stagger: 0.08 }, 0)
      .fromTo(caret, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.2);

    list.forEach((line, i) => {
      const last = i === list.length - 1;
      const typeDur = Math.min(0.95, 0.1 + line.length * 0.055);
      tl.set(txt, { text: "", autoAlpha: 1, y: 6, filter: "blur(4px)" }, i === 0 ? 0.45 : ">")
        .to(txt, { y: 0, filter: "blur(0px)", duration: 0.45 }, "<")
        .to(txt, { text: { value: line }, duration: typeDur, ease: "none" }, "<")
        .to(steps[i] ?? {}, { scaleX: 1, duration: typeDur + (last ? 0.2 : 1.05), ease: "power1.inOut" }, "<");
      if (!last) {
        tl.to({}, { duration: 0.85 })
          .to(txt, { autoAlpha: 0, y: -8, filter: "blur(6px)", duration: 0.55, ease: "power2.in" });
      } else {
        tl.to(caret, { autoAlpha: 0, duration: 0.5 }, "+=0.35")
          .to(txt, { textShadow: "0 0 42px rgba(185,204,255,.55)", duration: 1.6, ease: "sine.out" }, "<")
          .fromTo(q("[data-intro-sub]"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.9 }, "<0.2")
          .to({}, { duration: 1.2 })
          .to(el, { yPercent: -100, duration: 1.1, ease: "expo.inOut" });
      }
    });

    const skip = () => tl.progress(1);
    const btn = q("[data-intro-skip]")[0];
    btn?.addEventListener("click", skip);
    return () => { btn?.removeEventListener("click", skip); blink.kill(); };
  }, { scope: root, dependencies: [list.length] });

  if (gone) return null;

  return (
    <div ref={root} id="intro" role="status" aria-live="polite" aria-label={`Loading ${tagline}`} className="fixed inset-0 z-[100] grid grid-rows-[auto_1fr_auto] overflow-hidden bg-[#07090F] px-4 py-7 text-[#F4F2EC] sm:px-8 md:px-12">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div data-intro-orb className="absolute left-1/2 top-1/2 h-[46vmax] w-[46vmax] -ml-[23vmax] -mt-[23vmax] rounded-full bg-[radial-gradient(circle,rgba(60,96,210,.55),transparent_65%)] opacity-60 blur-[80px]" />
        <div data-intro-orb className="absolute left-[18%] top-[62%] h-[30vmax] w-[30vmax] rounded-full bg-[radial-gradient(circle,rgba(242,196,107,.22),transparent_65%)] opacity-60 blur-[80px]" />
        <div data-intro-orb className="absolute right-[8%] top-[8%] h-[26vmax] w-[26vmax] rounded-full bg-[radial-gradient(circle,rgba(140,120,255,.25),transparent_65%)] opacity-60 blur-[80px]" />
      </div>

      <div data-intro-meta className="relative flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/55">
        <span>{tagline}</span>
        <button type="button" data-intro-skip className="rounded-full px-4 py-2 uppercase tracking-[0.22em] ring-1 ring-white/15 transition-colors hover:text-white hover:ring-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B9CCFF]">Skip</button>
      </div>

      <div className="relative grid place-items-center text-center">
        <div>
          <p className="min-h-[1.1em] whitespace-nowrap font-serif text-[clamp(2.4rem,10.5vw,8.5rem)] font-normal leading-none tracking-[-0.02em]" style={{ fontFamily: '"Instrument Serif","Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif' }}>
            <span data-intro-txt className="inline-block" />
            <span data-intro-caret aria-hidden className="ml-[0.08em] inline-block h-[0.78em] w-[2px] bg-current align-[-0.04em] opacity-0" />
          </p>
          <p data-intro-sub className="mt-7 text-xs uppercase tracking-[0.28em] text-white/55 opacity-0">Presbyterian Church, Accra</p>
        </div>
      </div>

      <div data-intro-meta className="relative flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/55">
        <span>Welcome</span>
        <div className="flex gap-1.5" aria-hidden>
          {list.map((_, i) => <i key={i} className="relative block h-[2px] w-[22px] overflow-hidden rounded bg-white/10"><span data-intro-step className="absolute inset-0 origin-left scale-x-0 bg-[#F4F2EC]" /></i>)}
        </div>
      </div>
    </div>
  );
}
