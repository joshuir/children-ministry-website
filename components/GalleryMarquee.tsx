"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { MediaFrame } from "./ui";
import { Lightbox } from "./Gallery";
import type { GalleryCategory, GalleryItem } from "@/lib/types";

/**
 * Album carousel, in the style of a brand-logo strip: one same-sized card per album,
 * gliding left at a constant speed forever (pure CSS transform, so it stays smooth on phones).
 * Each card crossfades to the album's next photo or video every 10 seconds; the next file is
 * preloaded and decoded first so the change never flashes. Hover or keyboard focus pauses the
 * glide; the pause button stops both the glide and the rotation (WCAG 2.2.2).
 * Tap a card to open that album full screen at the photo it's showing.
 */

const ROTATE_MS = 10_000;
const SPEED = 40; // px per second
const isVideo = (src?: string) => !!src && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(src);

interface Album { id: GalleryCategory; label: string; items: GalleryItem[]; offset: number }

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
  const [prev, setPrev] = useState<number | null>(null);
  const last = useRef(index);

  useEffect(() => {
    if (index === last.current) return;
    setPrev(last.current);
    last.current = index;
    const t = setTimeout(() => setPrev(null), 1000);
    return () => clearTimeout(t);
  }, [index]);

  const item = album.items[index];
  const before = prev !== null ? album.items[prev] : null;
  const many = album.items.length > 1;

  return (
    <button
      type="button"
      tabIndex={hidden ? -1 : 0}
      aria-hidden={hidden || undefined}
      aria-label={`Open ${album.label} album`}
      onClick={() => onOpen(album, index)}
      data-cursor="View"
      className="group/card w-[200px] shrink-0 text-left focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-brand-500 sm:w-[240px] md:w-[280px]"
    >
      <span className="relative block aspect-[4/5] overflow-hidden rounded-3xl bg-paper ring-1 ring-ink/5">
        {before && (
          <span key={`b-${before.id}`} className="absolute inset-0"><MediaFrame media={before.media} /></span>
        )}
        <span key={`c-${item.id}`} className={`absolute inset-0 transition-transform duration-700 ease-out group-hover/card:scale-105 ${before ? "animate-media-in" : ""}`}>
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
      <span className="mt-3 flex items-baseline justify-between gap-2">
        <span className="truncate font-display text-[14px] font-bold uppercase tracking-[0.01em] text-ink md:text-[15px]">{album.label}</span>
        <span className="shrink-0 text-xs font-semibold text-ink-mute">{album.items.length} {album.items.length === 1 ? "item" : "items"}</span>
      </span>
    </button>
  );
}

export function GalleryMarquee({ items, categories }: { items: GalleryItem[]; categories: { id: GalleryCategory; label: string }[] }) {
  const root = useRef<HTMLElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [start] = useState(() => Math.floor(Date.now() / ROTATE_MS) * ROTATE_MS);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [duration, setDuration] = useState(60);
  const [open, setOpen] = useState<{ items: GalleryItem[]; index: number } | null>(null);

  // One album per category that has media, newest first; staggered so cards don't all change at once.
  const albums = useMemo<Album[]>(() => {
    const out: Album[] = [];
    categories.forEach((c) => {
      const list = items.filter((i) => i.category === c.id).sort((a, b) => b.date.localeCompare(a.date));
      if (list.length) out.push({ id: c.id, label: c.label, items: list, offset: 0 });
    });
    const step = ROTATE_MS / Math.max(out.length, 1);
    return out.map((a, i) => ({ ...a, offset: Math.round(i * step) }));
  }, [items, categories]);

  // Repeat albums until one set is long enough to cover wide screens; the set is then rendered twice.
  const set = useMemo(() => {
    if (!albums.length) return [];
    const out: Album[] = [];
    while (out.length < 8) out.push(...albums);
    return out;
  }, [albums]);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // Constant speed whatever the screen or number of cards: duration follows the set's width.
  useEffect(() => {
    const el = setRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDuration(Math.max(20, el.offsetWidth / SPEED)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [set]);

  // Only animate while the strip is on screen.
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
  const catLabels = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.label])), [categories]);

  if (!albums.length) return null;
  const rotatePaused = paused || !visible || open !== null;

  return (
    <section ref={root} aria-label="Gallery albums" aria-roledescription="carousel" className="relative overflow-hidden bg-white py-14 md:py-20">
      <div className="container mb-6 flex items-center justify-between gap-4 md:mb-8">
        <p className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink-mute">Albums</p>
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-paper px-4 text-sm font-semibold text-ink ring-1 ring-ink/10 transition-colors hover:bg-ink/5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-brand-500"
        >
          {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
          {paused ? "Play" : "Pause"}
        </button>
      </div>

      {reduced ? (
        <div className="container flex flex-wrap justify-center gap-4">
          {albums.map((a) => <AlbumCard key={a.id} album={a} start={start} paused={rotatePaused} onOpen={openAlbum} />)}
        </div>
      ) : (
        <div className="group/strip relative [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
          <div
            className="flex w-max animate-marquee will-change-transform group-hover/strip:[animation-play-state:paused] group-focus-within/strip:[animation-play-state:paused]"
            style={{ animationDuration: `${duration}s`, animationPlayState: paused || !visible ? "paused" : undefined }}
          >
            {[0, 1].map((copy) => (
              <div key={copy} ref={copy === 0 ? setRef : undefined} className="flex shrink-0 gap-4 pr-4 md:gap-5 md:pr-5">
                {set.map((a, i) => (
                  <AlbumCard key={`${copy}-${a.id}-${i}`} album={a} start={start} paused={rotatePaused} hidden={copy === 1 || i >= albums.length} onOpen={openAlbum} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {open && <Lightbox items={open.items} index={open.index} onClose={close} onNav={nav} categories={catLabels} />}
    </section>
  );
}
