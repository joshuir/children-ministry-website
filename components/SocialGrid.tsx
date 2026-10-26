"use client";

import { isReduced } from "@/lib/motion-pref";
import { useRef, type PointerEvent } from "react";
import clsx from "clsx";
import { gsap, useGSAP } from "@/lib/gsap";
import { ArrowUpRight } from "lucide-react";
import { SocialIcon } from "./SocialLinks";
import type { SocialLink } from "@/lib/types";

const verbs: Record<SocialLink["platform"], string> = { facebook: "Like our page", instagram: "Follow", youtube: "Subscribe", tiktok: "Follow", x: "Follow", whatsapp: "Join channel" };

/**
 * Responsive social tiles. On a mouse, a blue fill grows from the exact point the cursor
 * enters and drains toward where it leaves; the icon pops and the arrow flies out.
 * On touch, tiles give a quick press-and-bounce instead.
 */
function Tile({ s, i }: { s: SocialLink; i: number }) {
  const fill = useRef<HTMLSpanElement>(null);
  const icon = useRef<HTMLSpanElement>(null);
  const arrow = useRef<HTMLSpanElement>(null);
  const { contextSafe } = useGSAP();
  const ok = () => typeof window !== "undefined" && !isReduced();

  function at(e: PointerEvent<HTMLAnchorElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const radius = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
    return { x, y, radius };
  }
  const enter = contextSafe((e: PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse" || !ok()) return;
    const { x, y, radius } = at(e);
    // A circle grows from the pointer — a transform (scale) instead of a clip-path, so it stays on the GPU.
    gsap.set(fill.current, { width: radius * 2, height: radius * 2, x: x - radius, y: y - radius });
    gsap.fromTo(fill.current, { scale: 0 }, { scale: 1, duration: 0.45, ease: "power3.out", overwrite: true });
    gsap.fromTo(icon.current, { rotate: 0, scale: 1 }, { keyframes: { rotate: [-14, 10, 0], scale: [1.18, 1.12, 1.08] }, duration: 0.5, ease: "power2.out" });
    gsap.to(arrow.current, { x: 3, y: -3, duration: 0.25, ease: "power2.out" });
  });
  const leave = contextSafe((e: PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType !== "mouse" || !ok()) return;
    const { x, y } = at(e);
    const w = Number(gsap.getProperty(fill.current, "width")) || 0;
    gsap.to(fill.current, { x: x - w / 2, y: y - w / 2, scale: 0, duration: 0.35, ease: "power2.in", overwrite: true });
    gsap.to(icon.current, { scale: 1, rotate: 0, duration: 0.3 });
    gsap.to(arrow.current, { x: 0, y: 0, duration: 0.3 });
  });

  const dark = i % 6 === 3;
  return (
    <a
      href={s.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${s.label}: ${s.handle} (opens in a new tab)`}
      onPointerEnter={enter}
      onPointerLeave={leave}
      className={clsx(
        "group relative flex h-full min-h-[148px] flex-col justify-between gap-5 overflow-hidden rounded-4xl p-5 outline-none ring-1 transition-[transform,box-shadow] duration-100 focus-visible:bg-brand-500 focus-visible:ring-[3px] focus-visible:ring-sun-400 active:scale-[.97] sm:min-h-[168px]",
        dark ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-ink/10",
      )}
    >
      <span ref={fill} aria-hidden className="pointer-events-none absolute left-0 top-0 h-0 w-0 scale-0 rounded-full bg-brand-500" />
      <span className="relative flex items-start justify-between">
        <span ref={icon} className={clsx("flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-150", dark ? "bg-white text-ink" : "bg-ink text-white", "[@media(hover:hover)]:group-hover:bg-white [@media(hover:hover)]:group-hover:text-brand-600 group-focus-visible:bg-white group-focus-visible:text-brand-600")}>
          <SocialIcon platform={s.platform} className="h-6 w-6" />
        </span>
        <span ref={arrow} className={clsx("flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-150", dark ? "bg-white/10" : "bg-ink/5", "[@media(hover:hover)]:group-hover:bg-sun-400 [@media(hover:hover)]:group-hover:text-ink")}>
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </span>
      <span className="relative min-w-0">
        <b className="block font-display text-lg font-semibold leading-tight transition-colors duration-150 [@media(hover:hover)]:group-hover:text-white group-focus-visible:text-white">{s.label}</b>
        <span className={clsx("block truncate text-sm transition-colors duration-150 [@media(hover:hover)]:group-hover:text-white/80 group-focus-visible:text-white/80", dark ? "text-white/70" : "text-ink-mute")}>{s.handle}</span>
        <span className={clsx("mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] transition-colors duration-150 [@media(hover:hover)]:group-hover:bg-white/15 [@media(hover:hover)]:group-hover:text-white", dark ? "bg-white/10 text-white" : "bg-brand-50 text-brand-700")}>{verbs[s.platform]}</span>
      </span>
    </a>
  );
}

export function SocialGrid({ links, columns = 6 }: { links: SocialLink[]; columns?: 3 | 6 }) {
  return (
    <ul className={clsx("grid grid-cols-2 gap-3 sm:gap-4", columns === 6 ? "sm:grid-cols-3 lg:grid-cols-6" : "sm:grid-cols-3")}>
      {links.map((s, i) => <li key={s.platform + i} data-reveal><Tile s={s} i={i} /></li>)}
    </ul>
  );
}
