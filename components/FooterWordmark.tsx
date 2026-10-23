"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * The giant name across the bottom of the footer (gsap.com-style sign-off).
 * It always fits the width exactly, rises letter by letter when it scrolls into view,
 * and each letter hops and lights up as the pointer sweeps across it.
 */
export function FooterWordmark({ text }: { text: string }) {
  const box = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLParagraphElement>(null);

  useGSAP((_ctx, contextSafe) => {
    const b = box.current, l = line.current;
    if (!b || !l) return;
    const fit = () => {
      l.style.fontSize = "100px";
      const w = l.scrollWidth;
      if (w) l.style.fontSize = `${Math.min(220, (b.clientWidth / w) * 100 * 0.98)}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(b);
    document.fonts?.ready.then(fit).catch(() => {});

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const letters = gsap.utils.toArray<HTMLElement>(".fw-l");
        gsap.from(letters, { yPercent: 110, rotation: (i) => (i % 2 ? 8 : -8), duration: 0.9, ease: "expo.out", stagger: { each: 0.035, from: "start" }, scrollTrigger: { trigger: b, start: "top 95%", once: true } });
        const hop = contextSafe!((e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          const t = e.currentTarget as HTMLElement;
          gsap.timeline({ overwrite: "auto" } as gsap.TimelineVars)
            .to(t, { yPercent: -12, color: ["#FFC53D", "#FF7A59", "#4FA8FF", "#FFFFFF"][Math.floor(Math.random() * 4)], duration: 0.2, ease: "power2.out" })
            .to(t, { yPercent: 0, duration: 0.6, ease: "power3.out" })
            .to(t, { color: "rgba(255,255,255,0.12)", duration: 1.2 }, "-=0.2");
        });
        letters.forEach((x) => x.addEventListener("pointerenter", hop));
        return () => letters.forEach((x) => x.removeEventListener("pointerenter", hop));
      });
    return () => ro.disconnect();
  }, { scope: box, dependencies: [text], revertOnUpdate: true });

  return (
    <div ref={box} aria-hidden className="mt-10 overflow-hidden pt-6">
      <p ref={line} className="inline-block whitespace-nowrap font-display font-extrabold leading-[0.9] tracking-[-0.04em]" style={{ fontSize: 100 }}>
        {Array.from(text).map((ch, i) => (
          <span key={i} className="fw-l inline-block cursor-default text-white/[0.12]">{ch === " " ? " " : ch}</span>
        ))}
      </p>
    </div>
  );
}
