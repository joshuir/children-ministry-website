/**
 * The site's animation system — small, reusable GSAP building blocks.
 *
 *   heroIntro()            staged entrance: background → visual → headline → copy → CTAs → details
 *   heroMouseInteraction() depth parallax that follows the pointer (desktop / tablet only)
 *   heroScroll()           hero content lifts and fades as the next section arrives (scrubbed)
 *   buttonHover()          premium CTA micro-interaction (scale, label shift, arrow, light sweep)
 *   cardHover()            lift, media zoom, arrow nudge, spotlight, siblings step back
 *   cursorInteraction()    see components/Cursor.tsx (contextual cursor, desktop only)
 *   sectionReveal()        elements rise in on enter and settle back out when scrolled past upward
 *
 * Every function only uses transforms and opacity, and returns either the animation it built
 * or a cleanup function, so callers inside useGSAP()/gsap.matchMedia() are fully reverted.
 *
 * Markup contract (data attributes):
 *   data-hero="bg | visual | word | body | cta | secondary | deco"   intro roles
 *   data-depth="-20 … 30"                                             pointer parallax (negative = moves away)
 *   data-hero-scroll="content | visual | media | deco"                scroll transformation layers
 *   data-card, data-card-media, data-card-arrow, data-card-group     card hover
 */
import { gsap, ScrollTrigger } from "@/lib/gsap";

/* -------------------------------------------------------------- device tiers */

export const MQ = {
  desktop: "(min-width: 1024px) and (hover: hover) and (pointer: fine)",
  tablet: "(min-width: 640px) and (max-width: 1023.98px)",
  mobile: "(max-width: 639.98px)",
  reduce: "(prefers-reduced-motion: reduce)",
  motion: "(prefers-reduced-motion: no-preference)",
} as const;

export type Tier = { desktop?: boolean; tablet?: boolean; mobile?: boolean; reduce?: boolean };

/** 1 on desktop, softer on tablet, minimal on phones, 0 when the user prefers reduced motion. */
export const intensity = (t: Tier) => (t.reduce ? 0 : t.desktop ? 1 : t.tablet ? 0.5 : 0.25);

const q = (root: Element, sel: string) => gsap.utils.toArray<HTMLElement>(root.querySelectorAll(sel));

/* -------------------------------------------------------------- hero */

/** Staged, cinematic entrance. Returns a paused timeline — call .play() when the page is ready. */
export function heroIntro(root: HTMLElement) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } });
  const bg = q(root, '[data-hero="bg"]'), visual = q(root, '[data-hero="visual"]'), words = q(root, '[data-hero="word"]');
  const body = q(root, '[data-hero="body"]'), cta = q(root, '[data-hero="cta"]'), secondary = q(root, '[data-hero="secondary"]'), deco = q(root, '[data-hero="deco"]');

  // fromTo with explicit end states, so nothing depends on pre-hidden CSS values.
  if (bg.length) tl.fromTo(bg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.2, ease: "power2.out" }, 0);
  if (visual.length) tl.fromTo(visual, { autoAlpha: 0, scale: 1.06 }, { autoAlpha: 1, scale: 1, duration: 1.4, ease: "expo.out" }, 0.1);             // 1. visual
  if (words.length) tl.fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.06 }, 0.3);                           // 2. headline
  if (body.length) tl.fromTo(body, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9 }, words.length ? "-=0.65" : 0.4);                     // 3. supporting copy
  if (cta.length) tl.fromTo(cta, { autoAlpha: 0, y: 12, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.08 }, "-=0.55");     // 4. CTAs
  if (secondary.length) tl.fromTo(secondary, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.1 }, "-=0.45");                // 5. details
  if (deco.length) tl.fromTo(deco, { autoAlpha: 0, x: (i) => (i % 2 ? 36 : -36), y: 28, rotation: (i) => (i % 2 ? -10 : 10) }, { autoAlpha: 1, x: 0, y: 0, rotation: 0, duration: 1.2, ease: "expo.out", stagger: 0.08 }, "-=1");
  return tl;
}

/**
 * Pointer-driven depth: [data-depth] layers drift with the cursor (positive values toward it,
 * negative away from it). Movement is capped by the depth value so nothing ever leaves the screen.
 */
export function heroMouseInteraction(root: HTMLElement, strength = 1) {
  if (strength <= 0) return () => {};
  const layers = q(root, "[data-depth]").map((el) => ({
    d: Number(el.dataset.depth) || 0,
    x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3.out" }),
    y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3.out" }),
  }));
  const tilt = q(root, "[data-hero-tilt]").map((el) => {
    gsap.set(el, { transformPerspective: 1100 });
    return { ry: gsap.quickTo(el, "rotationY", { duration: 0.9, ease: "power3.out" }), rx: gsap.quickTo(el, "rotationX", { duration: 0.9, ease: "power3.out" }) };
  });
  let rect = root.getBoundingClientRect();
  const measure = () => { rect = root.getBoundingClientRect(); };
  const move = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const px = gsap.utils.clamp(-0.5, 0.5, (e.clientX - rect.left) / rect.width - 0.5);
    const py = gsap.utils.clamp(-0.5, 0.5, (e.clientY - rect.top) / rect.height - 0.5);
    layers.forEach((l) => { l.x(px * l.d * strength); l.y(py * l.d * strength); });
    tilt.forEach((t) => { t.ry(px * 5 * strength); t.rx(-py * 4 * strength); });
  };
  const reset = () => { layers.forEach((l) => { l.x(0); l.y(0); }); tilt.forEach((t) => { t.ry(0); t.rx(0); }); };
  root.addEventListener("pointerenter", measure);
  root.addEventListener("pointermove", move);
  root.addEventListener("pointerleave", reset);
  window.addEventListener("scroll", measure, { passive: true });
  window.addEventListener("resize", measure);
  return () => {
    root.removeEventListener("pointerenter", measure);
    root.removeEventListener("pointermove", move);
    root.removeEventListener("pointerleave", reset);
    window.removeEventListener("scroll", measure);
    window.removeEventListener("resize", measure);
  };
}

/** As the hero scrolls away: content lifts and softens, the visual parallaxes, decorations drift at their own speeds. */
export function heroScroll(root: HTMLElement, strength = 1) {
  if (strength <= 0) return null;
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.6 },
  });
  const content = q(root, '[data-hero-scroll="content"]'), visual = q(root, '[data-hero-scroll="visual"]');
  const media = q(root, '[data-hero-scroll="media"]'), bg = q(root, '[data-hero="bg"]'), deco = q(root, '[data-hero-scroll="deco"]');
  if (content.length) tl.to(content, { y: -90 * strength, opacity: 0.15 }, 0);
  if (visual.length) tl.to(visual, { y: -50 * strength }, 0);
  if (media.length) tl.to(media, { scale: 1 + 0.08 * strength }, 0);
  // Background drift is desktop-only: scaling this big layer on phones made iOS Safari paint black blocks.
  if (bg.length && strength >= 1 && matchMedia("(hover: hover) and (pointer: fine)").matches) tl.to(bg, { scale: 1 + 0.06 * strength, yPercent: 6 * strength }, 0);
  deco.forEach((d, i) => tl.to(d, { y: -(70 + i * 45) * strength }, 0));
  return tl;
}

/* -------------------------------------------------------------- buttons */

type Hover = { enter: () => void; leave: () => void };
const buttonCache = new WeakMap<HTMLElement, Hover>();

/**
 * Primary CTA: scales a touch, label eases back, arrow moves forward, a soft light sweeps across.
 * Secondary CTA: label nudges, icon turns slightly; border/background colour is a CSS transition.
 */
export function buttonHover(el: HTMLElement): Hover {
  const cached = buttonCache.get(el);
  if (cached) return cached;
  const primary = /\bbtn-(primary|sun|dark)\b/.test(el.className);
  const label = el.querySelector<HTMLElement>(".btn-label");
  const icon = el.querySelector<SVGElement>(":scope > svg:last-child, :scope > .btn-label + svg");
  const tl = gsap.timeline({ paused: true, defaults: { duration: 0.35, ease: "power3.out" } });
  tl.to(el, { scale: primary ? 1.035 : 1.02 }, 0);
  if (label) tl.to(label, { x: icon ? -2 : 0, y: icon ? 0 : -1 }, 0);
  if (icon) tl.to(icon, primary ? { x: 4 } : { x: 2, rotation: -12 }, 0);
  const api = {
    enter: () => {
      tl.play();
      if (primary) gsap.fromTo(el, { "--sweep": "-130%" }, { "--sweep": "130%", duration: 0.85, ease: "power2.inOut", overwrite: "auto" });
    },
    leave: () => { tl.reverse(); },
  };
  buttonCache.set(el, api);
  return api;
}

/* -------------------------------------------------------------- cards */

const cardCache = new WeakMap<HTMLElement, Hover>();

/** Lift + very small scale, media zooms inside its clipped frame, arrow nudges, siblings step back. */
export function cardHover(card: HTMLElement): Hover {
  const cached = cardCache.get(card);
  if (cached) return cached;
  const media = q(card, "[data-card-media] > *");
  const arrow = q(card, "[data-card-arrow]");
  const icon = q(card, "[data-pop]");
  const group = card.closest<HTMLElement>("[data-card-group]");
  const siblings = () => (group ? q(group, "[data-card]").filter((c) => c !== card && !c.contains(card) && !card.contains(c)) : []);
  const api = {
    enter: () => {
      card.classList.add("is-lit");
      gsap.to(card, { y: -6, scale: 1.012, duration: 0.45, ease: "power3.out", overwrite: "auto" });
      if (media.length) gsap.to(media, { scale: 1.06, duration: 0.9, ease: "power3.out", overwrite: "auto" });
      if (arrow.length) gsap.to(arrow, { x: 3, y: -3, duration: 0.35, ease: "power3.out", overwrite: "auto" });
      if (icon.length) gsap.to(icon, { rotation: -6, scale: 1.06, duration: 0.45, ease: "power3.out", overwrite: "auto" });
      const others = siblings();
      if (others.length) gsap.to(others, { opacity: 0.72, duration: 0.4, ease: "power2.out", overwrite: "auto" });
      gsap.to(card, { opacity: 1, duration: 0.3, overwrite: false });
    },
    leave: () => {
      card.classList.remove("is-lit");
      gsap.to(card, { y: 0, scale: 1, duration: 0.55, ease: "power3.out", overwrite: "auto" });
      if (media.length) gsap.to(media, { scale: 1, duration: 0.7, ease: "power3.out", overwrite: "auto" });
      if (arrow.length) gsap.to(arrow, { x: 0, y: 0, duration: 0.4, ease: "power3.out", overwrite: "auto" });
      if (icon.length) gsap.to(icon, { rotation: 0, scale: 1, duration: 0.45, ease: "power3.out", overwrite: "auto" });
      // siblings come back only when the pointer leaves the whole group (see groupLeave)
    },
  };
  cardCache.set(card, api);
  return api;
}

/** Restore every card in a group to full emphasis. */
export function groupLeave(group: HTMLElement) {
  gsap.to(q(group, "[data-card]"), { opacity: 1, duration: 0.45, ease: "power2.out", overwrite: "auto" });
}

/* -------------------------------------------------------------- section reveal */

/**
 * Elements rise in as they enter (opacity 0→1, y 40→0, scale .97→1, staggered in batches),
 * and settle back out gently when scrolled back above them — never an abrupt pop.
 */
export function sectionReveal(scope: ParentNode = document, t: Tier = {}) {
  const els = gsap.utils.toArray<HTMLElement>(scope.querySelectorAll("[data-reveal]"));
  if (!els.length) return [];
  const travel = t.mobile ? 24 : 40;
  const hidden = { autoAlpha: 0, y: travel, scale: 0.97 };
  gsap.set(els, hidden);
  return ScrollTrigger.batch(els, {
    start: "top 88%",
    interval: 0.1,
    batchMax: 6,
    onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, ease: "power3.out", stagger: 0.08, overwrite: "auto" }),
    onLeaveBack: (batch) => gsap.to(batch, { autoAlpha: 0, y: travel * 0.6, scale: 0.98, duration: 0.45, ease: "power2.in", overwrite: "auto" }),
  });
}
