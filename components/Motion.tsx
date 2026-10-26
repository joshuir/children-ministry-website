"use client";

import { isReduced } from "@/lib/motion-pref";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { MQ, buttonHover, cardHover, groupLeave, sectionReveal, tierOf } from "@/lib/motion";

/**
 * Site-wide motion, built from the shared GSAP system in lib/motion.ts.
 *
 * Scroll:   sectionReveal() for every [data-reveal]; [data-split] headings rise word by word;
 *           [data-count] numbers count up; [data-fill] statements fill in as they're read;
 *           photos drift gently inside their frames (desktop only); scroll progress bar.
 * Pointer:  buttonHover() on every .btn, cardHover() on every [data-card] (also on keyboard focus),
 *           magnetic CTAs on desktop only. Touch devices get press feedback instead.
 * Everything is set up inside gsap.matchMedia(), so it adapts per device and fully reverts.
 */

const reduced = () => isReduced();

function splitWords(el: HTMLElement) {
  if (el.dataset.splitDone) return Array.from(el.querySelectorAll<HTMLElement>(".split-w"));
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  for (const node of nodes) {
    const parts = (node.textContent || "").split(/(\s+)/);
    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (!part) continue;
      if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
      else {
        const s = document.createElement("span");
        s.className = "split-w";
        s.textContent = part;
        frag.appendChild(s);
      }
    }
    node.parentNode?.replaceChild(frag, node);
  }
  el.dataset.splitDone = "1";
  if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", el.textContent || "");
  return Array.from(el.querySelectorAll<HTMLElement>(".split-w"));
}

function useScrollMotion(pathname: string) {
  useEffect(() => {
    const root = document.documentElement;
    const mm = gsap.matchMedia();
    mm.add({ desktop: MQ.desktop, tablet: MQ.tablet, mobile: MQ.mobile }, (ctx) => {
      const t = tierOf(ctx.conditions);
      const calm = !!t.reduce;

      // Headings: words rise in, staggered (calm: they simply fade in together).
      gsap.utils.toArray<HTMLElement>("[data-split]").forEach((h) => {
        if (calm) { gsap.fromTo(h, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, ease: "power1.out", scrollTrigger: { trigger: h, start: "top 92%", once: true } }); return; }
        const words = splitWords(h);
        gsap.fromTo(words, { yPercent: 60, autoAlpha: 0 }, {
          yPercent: 0, autoAlpha: 1, duration: 0.8, ease: "power3.out", stagger: 0.04,
          scrollTrigger: { trigger: h, start: "top 90%", once: true },
        });
      });

      sectionReveal(document, t);
      root.classList.remove("motion-pending");

      // Count-up numbers ("180+", "24", "2006").
      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const raw = el.dataset.count || el.textContent || "";
        const m = raw.match(/^(\D*)(\d[\d,]*)(.*)$/);
        if (!m) return;
        const target = Number(m[2].replace(/,/g, ""));
        const from = target > 1900 && target < 2100 ? target - 25 : 0;
        const o = { v: from };
        el.textContent = m[1] + from + m[3];
        gsap.to(o, { v: target, duration: 1.6, ease: "power2.out", onUpdate: () => { el.textContent = m[1] + Math.round(o.v) + m[3]; }, scrollTrigger: { trigger: el, start: "top 92%", once: true } });
      });

      // Big statements fill in word by word as they are read.
      gsap.utils.toArray<HTMLElement>("[data-fill]").forEach((el) => {
        const words = splitWords(el);
        gsap.fromTo(words, { opacity: 0.2 }, { opacity: 1, stagger: 0.08, ease: "none", scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 50%", scrub: 0.6 } });
      });

      // Photos drift slightly inside their frames — desktop only, never in calm mode.
      if (t.desktop && !calm) {
        gsap.utils.toArray<HTMLElement>('[data-reveal="image"]').forEach((frame) => {
          const inner = frame.firstElementChild as HTMLElement | null;
          if (!inner || frame.offsetHeight < 160 || /transition|hover:/.test(inner.className)) return;
          gsap.fromTo(inner, { yPercent: -5, scale: 1.1 }, { yPercent: 5, scale: 1.1, ease: "none", scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom top", scrub: true } });
        });
      }

      if (!calm) gsap.utils.toArray<HTMLElement>("[data-eyebrow-line]").forEach((el) => {
        gsap.fromTo(el, { scaleX: 0 }, { scaleX: 1, transformOrigin: "left center", duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
      });

      const bar = document.getElementById("scroll-progress");
      if (bar) gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    });

    (window as unknown as { __motionReady: boolean }).__motionReady = true;
    return () => mm.revert();
  }, [pathname]);
}

function usePointerMotion() {
  useEffect(() => {
    const mm = gsap.matchMedia();

    // Desktop + tablet with a real pointer: CTA and card hover, spotlight, magnetic CTAs (desktop only).
    // Hover feedback stays in calm mode (it only answers the visitor's own pointer); magnetic pull does not.
    mm.add({ desktop: MQ.desktop, hover: MQ.finePointer }, (ctx) => {
      const { hover } = ctx.conditions as { desktop: boolean; hover: boolean };
      const desktop = !!(ctx.conditions as { desktop: boolean }).desktop && !isReduced();
      if (!hover) return;
      let btn: HTMLElement | null = null, card: HTMLElement | null = null, group: HTMLElement | null = null;
      let mq: { x: (v: number) => void; y: (v: number) => void } | null = null;

      const onOver = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const t = e.target as Element;
        const b = t.closest<HTMLElement>(".btn");
        if (b !== btn) {
          if (btn) { buttonHover(btn).leave(); mq?.x(0); mq?.y(0); }
          btn = b; mq = null;
          if (b && !b.hasAttribute("disabled")) {
            // magnetic setters first (quickTo), then the hover timeline, so neither overwrites the other
            if (desktop) mq = { x: gsap.quickTo(b, "x", { duration: 0.4, ease: "power3.out", overwrite: false }), y: gsap.quickTo(b, "y", { duration: 0.4, ease: "power3.out", overwrite: false }) };
            buttonHover(b).enter();
          }
        }
        const c = t.closest<HTMLElement>("[data-card]");
        if (c !== card) {
          if (card) cardHover(card).leave();
          card = c;
          if (c) cardHover(c).enter();
        }
        const g = t.closest<HTMLElement>("[data-card-group]");
        if (group && group !== g) groupLeave(group);
        group = g;
      };
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        if (btn && mq) {
          const r = btn.getBoundingClientRect();
          mq.x((e.clientX - (r.left + r.width / 2)) * 0.18);
          mq.y((e.clientY - (r.top + r.height / 2)) * 0.25);
        }
        if (card) {
          const r = card.getBoundingClientRect();
          card.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
          card.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
        }
      };
      const onLeaveDoc = () => {
        if (btn) buttonHover(btn).leave();
        if (card) cardHover(card).leave();
        if (group) groupLeave(group);
        btn = card = group = null;
      };
      document.addEventListener("pointerover", onOver, { passive: true });
      document.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeaveDoc);
      return () => {
        document.removeEventListener("pointerover", onOver);
        document.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeaveDoc);
      };
    });

    // Keyboard users get the same card emphasis on focus (any device, unless reduced motion).
    if (!isReduced()) mm.add("all", () => {
      const onFocus = (e: FocusEvent) => {
        const c = (e.target as Element).closest?.<HTMLElement>("[data-card]");
        if (c && (e.target as HTMLElement).matches(":focus-visible")) cardHover(c).enter();
      };
      const onBlur = (e: FocusEvent) => {
        const c = (e.target as Element).closest?.<HTMLElement>("[data-card]");
        if (!c) return;
        cardHover(c).leave();
        const g = c.closest<HTMLElement>("[data-card-group]");
        if (g && !g.contains(e.relatedTarget as Node)) groupLeave(g);
      };
      document.addEventListener("focusin", onFocus);
      document.addEventListener("focusout", onBlur);
      return () => { document.removeEventListener("focusin", onFocus); document.removeEventListener("focusout", onBlur); };
    });

    // Touch: a soft ripple on buttons for press feedback.
    const onDown = (e: PointerEvent) => {
      if (reduced()) return;
      const b = (e.target as Element).closest<HTMLElement>(".btn, [data-ripple]");
      if (!b) return;
      const r = b.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2.2;
      const dot = document.createElement("span");
      dot.setAttribute("aria-hidden", "true");
      dot.className = "ripple";
      dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      b.appendChild(dot);
      gsap.fromTo(dot, { scale: 0, opacity: 0.3 }, { scale: 1, opacity: 0, duration: 0.6, ease: "power2.out", onComplete: () => dot.remove() });
    };
    document.addEventListener("pointerdown", onDown, { passive: true });
    return () => { mm.revert(); document.removeEventListener("pointerdown", onDown); };
  }, []);
}

export function Motion() {
  const pathname = usePathname();
  useScrollMotion(pathname);
  usePointerMotion();
  return null;
}

/** Celebrate / complain helpers for forms. */
export function celebrate(el: HTMLElement | null) {
  if (!el || reduced()) return;
  gsap.fromTo(el, { scale: 0.96, autoAlpha: 0, y: 12 }, { scale: 1, autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out" });
  const colors = ["#2563EB", "#FFC53D", "#FF7A59", "#4FA8FF", "#0B1530"];
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 26; i++) {
    const c = document.createElement("span");
    c.setAttribute("aria-hidden", "true");
    c.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top + 40}px;width:8px;height:12px;border-radius:2px;background:${colors[i % colors.length]};pointer-events:none;z-index:100`;
    document.body.appendChild(c);
    gsap.to(c, {
      x: gsap.utils.random(-220, 220), y: gsap.utils.random(-200, 120), rotation: gsap.utils.random(-360, 360), opacity: 0,
      duration: gsap.utils.random(0.9, 1.5), ease: "power3.out", onComplete: () => c.remove(),
    });
  }
}

export function shake(el: HTMLElement | null) {
  if (!el || reduced()) return;
  gsap.fromTo(el, { x: 0 }, { keyframes: { x: [-10, 10, -7, 7, -3, 0] }, duration: 0.45, ease: "power1.out" });
}
