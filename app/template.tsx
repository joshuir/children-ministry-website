"use client";

import { isReduced } from "@/lib/motion-pref";
import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * Page transition: each route fades up on entry (skipped for reduced motion).
 * Fail-safe: GSAP advances on animation frames, which browsers pause or throttle (background tabs,
 * hidden panes, busy devices). If the fade hasn't finished after 900 ms, the page is shown at once,
 * so content can never be left invisible.
 */
export default function Template({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const el = ref.current;
    if (!el || isReduced()) return;
    const tween = gsap.fromTo(el, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out", clearProps: "transform,opacity,visibility" });
    const safety = window.setTimeout(() => { if (tween.progress() < 1) { tween.kill(); gsap.set(el, { clearProps: "transform,opacity,visibility" }); } }, 900);
    return () => window.clearTimeout(safety);
  }, { scope: ref });
  return <div ref={ref} className="flex-1">{children}</div>;
}
