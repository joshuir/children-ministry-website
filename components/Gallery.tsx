"use client";

import { isReduced } from "@/lib/motion-pref";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { gsap, useGSAP, Flip } from "@/lib/gsap";
import { CalendarDays, ChevronLeft, ChevronRight, Expand, Play, Search, X } from "lucide-react";
import { MediaFrame } from "./ui";
import { fmtDate } from "@/lib/format";
import type { GalleryCategory, GalleryItem } from "@/lib/types";

type Cat = GalleryCategory | "all";

export function GalleryFilter({ categories, active, counts, onChange }: { categories: { id: GalleryCategory; label: string }[]; active: Cat; counts: Record<string, number>; onChange: (c: Cat) => void }) {
  const all = [{ id: "all" as const, label: "All" }, ...categories];
  return (
    <div role="tablist" aria-label="Gallery categories" className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
      {all.map((c) => (
        <button
          key={c.id}
          role="tab"
          type="button"
          aria-selected={active === c.id}
          onClick={() => onChange(c.id)}
          className={clsx(
            "inline-flex min-h-[46px] shrink-0 items-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-all duration-200",
            active === c.id ? "bg-ink text-white shadow-[0_3px_0_0_#000]" : "bg-white text-ink-soft ring-1 ring-ink/10 hover:-translate-y-0.5 hover:text-ink",
          )}
        >
          {c.label}
          <span className={clsx("rounded-full px-2 text-xs font-bold", active === c.id ? "bg-white/15" : "bg-ink/5")}>{counts[c.id] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}

export function Lightbox({ items, index, onClose, onNav, categories }: { items: GalleryItem[]; index: number; onClose: () => void; onNav: (d: 1 | -1) => void; categories: Record<string, string> }) {
  const item = items[index];
  const dialog = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNav(1);
      if (e.key === "ArrowLeft") onNav(-1);
      if (e.key === "Tab" && dialog.current) {
        const f = dialog.current.querySelectorAll<HTMLElement>("button");
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; prev?.focus(); };
  }, [onClose, onNav]);

  useGSAP(() => {
    if (!stage.current || isReduced()) return;
    gsap.fromTo(stage.current, { autoAlpha: 0, scale: 0.97 }, { autoAlpha: 1, scale: 1, duration: 0.4, ease: "power2.out" });
  }, { scope: stage, dependencies: [index] });

  return (
    <div ref={dialog} role="dialog" aria-modal="true" aria-label={`${item.event} — ${index + 1} of ${items.length}`} tabIndex={-1} className="fixed inset-0 z-[60] flex flex-col bg-ink/95 outline-none backdrop-blur-sm"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => { if (touch.current === null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 50) onNav(dx < 0 ? 1 : -1); touch.current = null; }}>
      <div className="flex items-center justify-between p-4 text-white md:p-6">
        <p className="text-sm font-semibold text-white/70">{index + 1} / {items.length}</p>
        <button type="button" onClick={onClose} aria-label="Close" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition-colors duration-100 hover:bg-white/20"><X className="h-6 w-6" /></button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 md:px-24">
        <div ref={stage} className="relative aspect-[4/3] max-h-full w-full max-w-5xl overflow-hidden rounded-4xl bg-white/5">
          <MediaFrame media={item.media} />
          {item.type === "video" && (
            <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-lift"><Play className="ml-1 h-8 w-8 fill-ink text-ink" /></span>
          )}
        </div>
        <button type="button" onClick={() => onNav(-1)} aria-label="Previous" className="absolute left-2 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-lift transition-transform hover:scale-105 md:left-6"><ChevronLeft className="h-7 w-7" /></button>
        <button type="button" onClick={() => onNav(1)} aria-label="Next" className="absolute right-2 top-1/2 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ink shadow-lift transition-transform hover:scale-105 md:right-6"><ChevronRight className="h-7 w-7" /></button>
      </div>
      <div className="mx-auto w-full max-w-5xl px-4 pb-6 pt-5 text-white md:px-6 md:pb-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sun-400 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink">{categories[item.category]}</span>
          <span className="inline-flex items-center gap-1.5 text-sm text-white/70"><CalendarDays className="h-4 w-4" />{fmtDate(item.date)}</span>
        </div>
        <p className="mt-2 font-display text-2xl font-semibold">{item.event}</p>
        <p className="mt-1 text-white/80">{item.caption}</p>
      </div>
    </div>
  );
}

export function Gallery({ items, categories, limit, showControls = true }: { items: GalleryItem[]; categories: { id: GalleryCategory; label: string }[]; limit?: number; showControls?: boolean }) {
  const [active, setActive] = useState<Cat>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const grid = useRef<HTMLDivElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const catLabels = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.label])), [categories]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    items.forEach((i) => (c[i.category] = (c[i.category] ?? 0) + 1));
    return c;
  }, [items]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((i) => (active === "all" || i.category === active) && (!q || `${i.event} ${i.caption} ${catLabels[i.category]}`.toLowerCase().includes(q)));
    return limit ? list.slice(0, limit) : list;
  }, [items, active, query, limit, catLabels]);

  const capture = () => {
    if (grid.current && !isReduced()) flipState.current = Flip.getState(grid.current.querySelectorAll("[data-flip]"));
  };

  useGSAP(() => {
    if (!flipState.current) return;
    Flip.from(flipState.current, {
      duration: 0.55, ease: "power3.inOut", absolute: true, scale: true, nested: true,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.45, delay: 0.1 }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.9, duration: 0.3 }),
    });
    flipState.current = null;
  }, { scope: grid, dependencies: [shown] });

  const nav = useCallback((d: 1 | -1) => setOpen((i) => (i === null ? i : (i + d + shown.length) % shown.length)), [shown.length]);
  const close = useCallback(() => setOpen(null), []);

  return (
    <div>
      {showControls && (
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <GalleryFilter categories={categories} active={active} counts={counts} onChange={(c) => { capture(); setActive(c); }} />
          <label className="relative block lg:w-72">
            <span className="sr-only">Search the gallery</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-mute" />
            <input type="search" value={query} onChange={(e) => { capture(); setQuery(e.target.value); }} placeholder="Search events…" className="h-12 w-full rounded-full bg-white pl-12 pr-4 outline-none ring-1 ring-ink/10 focus:ring-[3px] focus:ring-brand-500" />
          </label>
        </div>
      )}

      <div ref={grid} className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {shown.map((item, i) => (
          <button
            key={item.id}
            data-flip
            data-flip-id={item.id}
            type="button"
            onClick={() => setOpen(i)}
            data-cursor="View"
            aria-label={`Open ${item.type === "video" ? "video" : "photo"}: ${item.caption}`}
            className="group relative block w-full break-inside-avoid overflow-hidden rounded-4xl bg-white text-left shadow-card ring-1 ring-ink/5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-500"
          >
            <div className={clsx("overflow-hidden", item.aspect === "tall" ? "aspect-[4/5]" : item.aspect === "wide" ? "aspect-[16/10]" : "aspect-square")}>
              <div className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.06]"><MediaFrame media={item.media} /></div>
            </div>
            <div className="flex items-end justify-between gap-3 px-5 pb-5 pt-4">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-600">{catLabels[item.category]}</p>
                <p className="mt-0.5 font-display text-lg font-semibold leading-tight text-ink">{item.event}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-ink-mute">{fmtDate(item.date, { month: "short", year: "numeric" })}</span>
            </div>
            <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-card">
              {item.type === "video" ? <Play className="ml-0.5 h-4 w-4 fill-ink" /> : <Expand className="h-4 w-4" />}
            </span>
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="rounded-4xl bg-white p-12 text-center text-ink-mute ring-1 ring-ink/5">No photos match that search yet.</p>}

      {open !== null && shown[open] && <Lightbox items={shown} index={open} onClose={close} onNav={nav} categories={catLabels} />}
    </div>
  );
}
