"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { gsap, useGSAP } from "@/lib/gsap";

/**
 * A custom cursor for mouse/trackpad users (touch devices keep their normal behaviour):
 *  - a small dot that tracks the pointer exactly, and a soft ring that follows with a little lag
 *    and stretches in the direction of travel;
 *  - over links and buttons the ring swells and tints;
 *  - over anything with data-cursor="Label" it becomes a filled bubble with that word (View, Drag, Play…);
 *  - while the page scrolls it turns into a scroll badge with an arrow showing the direction;
 *  - inside text fields it steps aside so the normal text caret shows.
 * Off in the admin dashboard and for people who prefer reduced motion.
 */
export function Cursor() {
  const pathname = usePathname() || "/";
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const arrow = useRef<HTMLSpanElement>(null);
  const off = pathname.startsWith("/admin");

  useGSAP(() => {
    const html = document.documentElement;
    if (off || !matchMedia("(hover: hover) and (pointer: fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      html.classList.remove("has-cursor");
      return;
    }
    const d = dot.current!, r = ring.current!, l = label.current!, a = arrow.current!;
    html.classList.add("has-cursor");

    gsap.set([d, r], { xPercent: -50, yPercent: -50, x: -100, y: -100 });
    const dx = gsap.quickTo(d, "x", { duration: 0.08, ease: "power3" });
    const dy = gsap.quickTo(d, "y", { duration: 0.08, ease: "power3" });
    const rx = gsap.quickTo(r, "x", { duration: 0.38, ease: "power3" });
    const ry = gsap.quickTo(r, "y", { duration: 0.38, ease: "power3" });
    // Size and stretch are both transforms (no width/height tweens): scale = mode size × stretch.
    const FULL = 82;
    const look = { base: 30 / FULL, sx: 1, sy: 1 };
    const paint = () => gsap.set(r, { scaleX: look.base * look.sx, scaleY: look.base * look.sy });
    const qsx = gsap.quickTo(look, "sx", { duration: 0.25, ease: "power2.out", onUpdate: paint });
    const qsy = gsap.quickTo(look, "sy", { duration: 0.25, ease: "power2.out", onUpdate: paint });
    const stretch = (sx: number, sy: number) => { qsx(sx); qsy(sy); };
    paint();

    type Mode = "default" | "link" | "label" | "text" | "scroll";
    let mode: Mode = "default";
    let visible = false;
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;
    let hoverMode: Mode = "default", hoverText = "";

    const apply = (m: Mode, text = "") => {
      if (m === mode && text === l.textContent) return;
      mode = m;
      r.dataset.mode = m;
      l.textContent = text;
      const size = { default: 30, link: 46, label: 82, text: 30, scroll: 60 }[m];
      gsap.to(look, { base: size / FULL, duration: 0.35, ease: "power3.out", onUpdate: paint });
      gsap.to(d, { scale: m === "default" ? 1 : 0, duration: 0.25, overwrite: "auto" });
      gsap.to([r, d], { autoAlpha: m === "text" || !visible ? 0 : 1, duration: 0.2 });
      gsap.to(l, { autoAlpha: m === "label" ? 1 : 0, scale: m === "label" ? 1 : 0.6, duration: 0.25, overwrite: "auto" });
      gsap.to(a, { autoAlpha: m === "scroll" ? 1 : 0, scale: m === "scroll" ? 1 : 0.5, duration: 0.25, overwrite: "auto" });
    };

    const modeFor = (t: Element | null): [Mode, string] => {
      if (!t) return ["default", ""];
      const tagged = t.closest<HTMLElement>("[data-cursor]");
      if (tagged) return ["label", tagged.dataset.cursor || ""];
      if (t.closest("input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]), textarea, select, [contenteditable=true]")) return ["text", ""];
      if (t.closest("a, button, [role=button], [role=tab], [role=menuitemradio], label, summary")) return ["link", ""];
      return ["default", ""];
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!visible) { visible = true; gsap.set([d, r], { x: e.clientX, y: e.clientY }); apply(mode === "scroll" ? "scroll" : hoverMode, hoverText); gsap.to([r, d], { autoAlpha: mode === "text" ? 0 : 1, duration: 0.2 }); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      // (no stretching or trails — the cursor stays calm and precise)
    };
    const onOver = (e: PointerEvent) => {
      [hoverMode, hoverText] = modeFor(e.target as Element);
      if (mode !== "scroll") apply(hoverMode, hoverText);
    };
    const onDown = () => stretch(0.82, 0.82);
    const onUp = () => stretch(1, 1);
    const onLeave = () => { visible = false; gsap.to([r, d], { autoAlpha: 0, duration: 0.2 }); };
    const onWheel = (e: WheelEvent) => {
      if (!visible || Math.abs(e.deltaY) < 2) return;
      a.style.transform = `rotate(${e.deltaY > 0 ? 0 : 180}deg)`;
      apply("scroll");
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => apply(hoverMode, hoverText), 450);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    html.addEventListener("pointerleave", onLeave);
    return () => {
      clearTimeout(scrollTimer);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("wheel", onWheel);
      html.removeEventListener("pointerleave", onLeave);
      html.classList.remove("has-cursor");
    };
  }, { dependencies: [off], revertOnUpdate: true });

  if (off) return null;
  return (
    <div aria-hidden className="cm-cursor">
      <div ref={ring} className="cm-cursor-ring" data-mode="default">
        <span ref={label} className="cm-cursor-label" />
        <span ref={arrow} className="cm-cursor-arrow">
          <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
        </span>
      </div>
      <div ref={dot} className="cm-cursor-dot" />
    </div>
  );
}
