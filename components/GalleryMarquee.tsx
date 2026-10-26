"use client";

import { isReduced } from "@/lib/motion-pref";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Play, Search } from "lucide-react";
import { MediaFrame } from "./ui";
import { GalleryFilter, Lightbox } from "./Gallery";
import type { GalleryCategory, GalleryItem } from "@/lib/types";

/**
 * Album carousel, in the style of a brand-logo strip: one same-sized card per album,
 * gliding left at a constant speed forever (pure CSS transform, so it stays smooth on phones).
 * Each card crossfades to the album's next photo or video every 10 seconds; the next file is
 * preloaded and decoded first so the change never flashes. Hover or keyboard focus pauses the
 * glide.
 * Tap a card to open that album full screen at the photo it's showing.
 */

const ROTATE_MS = 10_000;
const SPEED = 40; // px per second
const isVideo = (src?: string) => !!src && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src);

interface Album { id: string; label: string; kicker?: string; items: GalleryItem[]; offset: number }

function preload(item?: GalleryItem): Promise<void> {
  const src = item?.media.src;
  if (!src || isVideo(src)) return Promise.resolve();
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  return (img.decode ? img.decode() : Promise.resolve()).catch(() => {});
}

/** Which item an album shows. Driven by a shared start time so repeated cards stay in sync. */
function useRotation(album: Album, start: number, paused: boolean) {
  const len = album.items.length;
  const indexAt = useCallback((t: number) => (len < 2 ? 0 : Math.floor((t - start + album.offset) / ROTATE_MS) % len), [len, start, album.offset]);
  const [index, setIndex] = useState(() => indexAt(start));

  useEffect(() => {
    if (len < 2 || paused) return;
    let timer: ReturnType<typeof setTimeout>;
    let alive = true;
    const schedule = () => {
      const now = Date.now();
      const wait = ROTATE_MS - ((now - start + album.offset) % ROTATE_MS);
      timer = setTimeout(async () => {
        if (!alive) return;
        if (!document.hidden) {
          const next = indexAt(Date.now() + 50);
          await preload(album.items[next]);
          if (alive) setIndex(next);
        }
        schedule();
      }, wait);
    };
    schedule();
    // Warm the cache for the upcoming file a little before it's needed.
    const warm = setTimeout(() => preload(album.items[(indexAt(Date.now()) + 1) % len]), 2000);
    return () => { alive = false; clearTimeout(timer); clearTimeout(warm); };
  }, [len, paused, start, album, indexAt]);

  return index;
}

function AlbumCard({ album, start, paused, hidden, onOpen }: { album: Album; start: number; paused: boolean; hidden?: boolean; onOpen: (album: Album, index: number) => void }) {
  const index = useRotation(album, start, paused);
  const cur = useRef<HTMLSpanElement>(null);
  // What's on screen: the current item and, during a fade, the one underneath it.
  const [shown, setShown] = useState<{ cur: number; prev: number | null }>({ cur: index, prev: null });
  if (shown.cur !== index) setShown({ cur: index, prev: shown.cur });
  const prev = shown.prev;

  // Crossfade the new media in over the old one (before first paint, so no flicker).
  useLayoutEffect(() => {
    if (prev === null) return;
    const anim = cur.current?.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 900, easing: "ease-in-out", fill: "both" });
    const t = setTimeout(() => setShown((sh) => ({ ...sh, prev: null })), 950);
    return () => { clearTimeout(t); anim?.cancel(); };
  }, [shown.cur, prev]);

  const item = album.items[index];
  const before = prev !== null ? album.items[prev] : null;
  const many = album.items.length > 1;

  return (
    <button
      type="button"
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden || undefined}
      aria-label={`Open ${album.label}`}
      onClick={() => onOpen(album, index)}
      data-cursor="View"
      className="group/card w-[200px] shrink-0 text-left focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-brand-500 sm:w-[240px] md:w-[280px]"
    >
      <span className="relative block aspect-[4/5] overflow-hidden rounded-3xl bg-paper ring-1 ring-ink/5">
        {before && (
          <span key={`b-${before.id}`} className="absolute inset-0"><MediaFrame media={before.media} /></span>
        )}
        <span key={`c-${item.id}`} ref={cur} className="absolute inset-0 transition-transform duration-700 ease-out group-hover/card:scale-105">
          <MediaFrame media={item.media} />
        </span>
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/55 to-transparent" />
        {item.type === "video" && (
          <span className="pointer-events-none absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink"><Play className="ml-0.5 h-4 w-4 fill-current" /></span>
        )}
        {many && (
          <span className="pointer-events-none absolute bottom-3 left-3 right-3 flex gap-1" aria-hidden>
            {album.items.slice(0, 12).map((x, i) => (
              <span key={x.id} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i === index % 12 ? "bg-white" : "bg-white/35"}`} />
            ))}
          </span>
        )}
      </span>
      {album.kicker && <span className="mt-3 block truncate text-[11px] font-bold uppercase tracking-wider text-brand-600">{album.kicker}</span>}
      <span className={`${album.kicker ? "mt-0.5" : "mt-3"} flex items-baseline justify-between gap-2`}>
        <span className="truncate font-display text-[14px] font-bold uppercase tracking-[0.01em] text-ink md:text-[15px]">{album.label}</span>
        <span className="shrink-0 text-xs font-semibold text-ink-mute">{album.items.length} {album.items.length === 1 ? "item" : "items"}</span>
      </span>
    </button>
  );
}

/** Stagger rotations so cards don't all change at the same moment. */
function stagger(list: Omit<Album, "offset">[]): Album[] {
  const step = ROTATE_MS / Math.max(list.length, 1);
  return list.map((a, i) => ({ ...a, offset: Math.round(i * step) }));
}

/**
 * The moving strip. Runs on requestAnimationFrame rather than a CSS animation, so it keeps moving
 * on computers with "animation effects" turned off (the site-wide reduced-motion rule freezes CSS
 * animations); those visitors get a gentler speed. Hover or keyboard focus pauses it, and it only
 * runs while on screen. direction -1 = leftwards, 1 = rightwards.
 */
function Strip({ albums, direction = -1, categories }: { albums: Album[]; direction?: 1 | -1; categories: Record<string, string> }) {
  const root = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [start] = useState(() => Math.floor(Date.now() / ROTATE_MS) * ROTATE_MS);
  const [visible, setVisible] = useState(true);
  const [hold, setHold] = useState(false);
  const [open, setOpen] = useState<{ items: GalleryItem[]; index: number } | null>(null);

  // Repeat cards until one set is long enough to cover wide screens; the set is then rendered twice.
  const set = useMemo(() => {
    if (!albums.length) return [];
    const out: Album[] = [];
    while (out.length < 8) out.push(...albums);
    return out;
  }, [albums]);

  const moving = !hold && visible && open === null;
  const x = useRef<number | null>(null);
  useEffect(() => {
    const el = strip.current, one = setRef.current;
    if (!el || !one || !moving) return;
    const speed = isReduced() ? SPEED * 0.6 : SPEED;
    let raf = 0, last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(now - last, 100); // no jump after a background tab
      last = now;
      const loop = one.offsetWidth;
      if (loop > 0) {
        if (x.current === null) x.current = direction < 0 ? 0 : -loop;
        x.current += (direction * speed * dt) / 1000;
        if (x.current <= -loop) x.current += loop;
        if (x.current > 0) x.current -= loop;
        el.style.transform = `translate3d(${x.current}px,0,0)`;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [moving, set, direction]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const openAlbum = useCallback((album: Album, index: number) => setOpen({ items: album.items, index }), []);
  const close = useCallback(() => setOpen(null), []);
  const nav = useCallback((d: 1 | -1) => setOpen((o) => (o ? { ...o, index: (o.index + d + o.items.length) % o.items.length } : o)), []);
  const rotatePaused = !visible || open !== null;

  return (
    <div
      ref={root}
      className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setHold(false)}
    >
      <div ref={strip} className="flex w-max will-change-transform">
        {[0, 1].map((copy) => (
          <div key={copy} ref={copy === 0 ? setRef : undefined} className="flex shrink-0 gap-4 pr-4 md:gap-5 md:pr-5">
            {set.map((a, i) => (
              <AlbumCard key={`${copy}-${a.id}-${i}`} album={a} start={start} paused={rotatePaused} hidden={copy === 1 || i >= albums.length} onOpen={openAlbum} />
            ))}
          </div>
        ))}
      </div>
      {open && <Lightbox items={open.items} index={open.index} onClose={close} onNav={nav} categories={categories} />}
    </div>
  );
}

const byNewest = (a: GalleryItem, b: GalleryItem) => b.date.localeCompare(a.date);

/** Top of the gallery page: one card per album (category). */
export function GalleryMarquee({ items, categories }: { items: GalleryItem[]; categories: { id: GalleryCategory; label: string }[] }) {
  const catLabels = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.label])), [categories]);
  const albums = useMemo(() => stagger(
    categories
      .map((c) => ({ id: c.id, label: c.label, items: items.filter((i) => i.category === c.id).sort(byNewest) }))
      .filter((a) => a.items.length),
  ), [items, categories]);
  if (!albums.length) return null;

  return (
    <section aria-label="Gallery albums" aria-roledescription="carousel" className="relative overflow-hidden bg-white py-14 md:py-20">
      <div className="container mb-6 md:mb-8">
        <p className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-mute">Albums</p>
      </div>
      <Strip albums={albums} categories={catLabels} />
    </section>
  );
}

/**
 * Replaces the old photo grid: one card per event (e.g. "Seniors Graduation 2026") rotating
 * through that event's photos and videos. Album chips and search choose which events glide past.
 */
export function EventCarousel({ items, categories }: { items: GalleryItem[]; categories: { id: GalleryCategory; label: string }[] }) {
  const [active, setActive] = useState<GalleryCategory | "all">("all");
  const [query, setQuery] = useState("");
  const catLabels = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.label])), [categories]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    items.forEach((i) => (c[i.category] = (c[i.category] ?? 0) + 1));
    return c;
  }, [items]);

  const events = useMemo(() => {
    const q = query.trim().toLowerCase();
    const shown = items.filter((i) => (active === "all" || i.category === active) && (!q || `${i.event} ${i.caption} ${catLabels[i.category]}`.toLowerCase().includes(q)));
    const groups = new Map<string, GalleryItem[]>();
    shown.slice().sort(byNewest).forEach((i) => {
      const key = `${i.category}::${(i.event || i.caption).trim().toLowerCase()}`;
      groups.set(key, [...(groups.get(key) || []), i]);
    });
    return stagger([...groups.entries()].map(([key, list]) => ({ id: key, label: list[0].event || list[0].caption, kicker: catLabels[list[0].category], items: list })));
  }, [items, active, query, catLabels]);

  return (
    <div>
      <div className="container mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <GalleryFilter categories={categories} active={active} counts={counts} onChange={setActive} />
        <label className="relative block lg:w-72">
          <span className="sr-only">Search the gallery</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-mute" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search events…" className="h-12 w-full rounded-full bg-white pl-12 pr-4 outline-none ring-1 ring-ink/10 focus:ring-[3px] focus:ring-brand-500" />
        </label>
      </div>
      {events.length ? (
        // Remount when the filter changes so the strip starts fresh with the new set.
        <Strip key={`${active}|${query}`} albums={events} direction={1} categories={catLabels} />
      ) : (
        <div className="container"><p className="rounded-4xl bg-white p-12 text-center text-ink-mute ring-1 ring-ink/5">No photos match that search yet.</p></div>
      )}
    </div>
  );
}
