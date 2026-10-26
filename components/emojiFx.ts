import { isReduced } from "@/lib/motion-pref";
import { gsap } from "@/lib/gsap";
import type { PointerEvent as RPointerEvent } from "react";

const reduced = () => typeof window !== "undefined" && isReduced();

/**
 * Instagram-Live style reaction stream: emojis rise from a point on the screen,
 * swaying side to side, growing then fading — a few at a time, slightly staggered.
 */
export function floatEmojis(from: Element | { x: number; y: number }, emojis: string | string[], count = 8) {
  if (reduced()) return;
  const list = Array.isArray(emojis) ? emojis : [emojis];
  const p = "getBoundingClientRect" in from ? (() => { const r = from.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })() : from;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.textContent = list[i % list.length];
    el.setAttribute("aria-hidden", "true");
    el.style.cssText = `position:fixed;left:${p.x}px;top:${p.y}px;z-index:120;pointer-events:none;font-size:${gsap.utils.random(20, 30)}px;line-height:1;transform:translate(-50%,-50%)`;
    document.body.appendChild(el);
    const rise = gsap.utils.random(140, 260);
    const sway = gsap.utils.random(18, 42) * (Math.random() < 0.5 ? -1 : 1);
    gsap.timeline({ delay: i * 0.07, onComplete: () => el.remove() })
      .fromTo(el, { y: 0, x: 0, scale: 0.3, opacity: 0 }, { y: -rise, scale: gsap.utils.random(0.9, 1.35), opacity: 1, duration: gsap.utils.random(1.3, 1.9), ease: "power1.out" })
      .to(el, { keyframes: { x: [0, sway, -sway * 0.6, sway * 0.4] }, duration: 1.6, ease: "sine.inOut" }, 0)
      .to(el, { opacity: 0, duration: 0.5 }, "-=0.5");
  }
}

/** The big heart that pops over a photo when you double-tap it. */
export function heartPop(host: HTMLElement) {
  if (reduced()) return;
  const wrap = document.createElement("span");
  wrap.className = "dt-heart";
  wrap.setAttribute("aria-hidden", "true");
  wrap.innerHTML = '<svg viewBox="0 0 24 24" width="110" height="110"><defs><linearGradient id="dtg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF7A59"/><stop offset="1" stop-color="#E11D48"/></linearGradient></defs><path fill="url(#dtg)" d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2.2 4.5 5.9 4.1 8.2 3.9 10 5.2 12 7.3c2-2.1 3.8-3.4 6.1-3.2 3.7.4 5.5 4.3 3.9 7.6C19.5 16.4 12 21 12 21z"/></svg>';
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  host.appendChild(wrap);
  gsap.timeline({ onComplete: () => wrap.remove() })
    .fromTo(wrap, { scale: 0, rotation: -18, opacity: 0.9 }, { scale: 1.25, rotation: 6, opacity: 1, duration: 0.28, ease: "back.out(3)" })
    .to(wrap, { scale: 1, rotation: 0, duration: 0.18 })
    .to(wrap, { scale: 0.92, duration: 0.12, yoyo: true, repeat: 1 }, "+=0.05")
    .to(wrap, { y: -80, scale: 0.4, opacity: 0, duration: 0.45, ease: "power2.in" }, "+=0.15");
}

/** Calls onDouble for a double-click (mouse) or a double-tap (touch) within 300ms. */
export function doubleTap(onDouble: (e: { clientX: number; clientY: number }) => void) {
  let last = 0;
  return (e: RPointerEvent) => {
    const now = Date.now();
    if (now - last < 300) { last = 0; onDouble(e); } else last = now;
  };
}
