"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

/** Page transition: each route fades up on entry (skipped for reduced motion). */
export default function Template({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    if (!ref.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(ref.current, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.55, ease: "power2.out", clearProps: "transform,opacity,visibility" });
  }, { scope: ref });
  return <div ref={ref} className="flex-1">{children}</div>;
}
