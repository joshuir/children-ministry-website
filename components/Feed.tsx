"use client";

import { isReduced } from "@/lib/motion-pref";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { gsap, useGSAP } from "@/lib/gsap";
import { ArrowUp, ShieldCheck } from "lucide-react";
import { BlogPost, type FeedPost } from "./BlogPost";
import type { Post, Teacher } from "@/lib/types";

type Kind = Post["kind"];

const filters: { id: "all" | Kind; label: string }[] = [
  { id: "all", label: "All posts" }, { id: "article", label: "Articles" }, { id: "announcement", label: "Announcements" }, { id: "verse", label: "Bible verses" },
  { id: "event", label: "Events" }, { id: "video", label: "Videos" }, { id: "image", label: "Photos" },
];

const POLL_MS = 8000;
const sortPosts = (l: FeedPost[]) => [...l].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.createdAt.localeCompare(a.createdAt));

/** Live indicator: pulses, and shows how long since the last sync. */
function LiveBadge({ lastSync, online }: { lastSync: number; online: boolean }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 5000); return () => clearInterval(t); }, []);
  const secs = Math.max(0, Math.round((Date.now() - lastSync) / 1000));
  return (
    <span className={clsx("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.08em]", online ? "bg-coral-100 text-coral-600" : "bg-ink/5 text-ink-mute")} role="status">
      <span className="relative flex h-2.5 w-2.5">
        {online && <span className="absolute inline-flex h-full w-full rounded-full bg-coral-400 opacity-75 lively:animate-ping" />}
        <span className={clsx("relative inline-flex h-2.5 w-2.5 rounded-full", online ? "bg-coral-400" : "bg-ink/30")} />
      </span>
      {online ? <>Live<span className="font-semibold normal-case tracking-normal text-coral-600/70" suppressHydrationWarning>· {secs < 6 ? "just now" : `${secs}s ago`}</span></> : "Offline — retrying"}
    </span>
  );
}

export function Feed({ initial, teachers, sidebar }: { initial: Post[]; teachers: Teacher[]; sidebar?: ReactNode }) {
  const [posts, setPosts] = useState<FeedPost[]>(initial);
  const [queued, setQueued] = useState<FeedPost[]>([]);
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [lastSync, setLastSync] = useState(() => Date.now());
  const [online, setOnline] = useState(true);
  const byId = useMemo(() => Object.fromEntries(teachers.map((t) => [t.id, t])), [teachers]);
  const pill = useRef<HTMLButtonElement>(null);
  const known = useRef(new Set(initial.map((p) => p.id)));

  const sync = useCallback(async () => {
    try {
      const res = await fetch("/api/feed", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const { posts: fresh } = (await res.json()) as { posts: Post[] };
      const freshIds = new Set(fresh.map((p) => p.id));
      const incoming = fresh.filter((p) => !known.current.has(p.id));
      incoming.forEach((p) => known.current.add(p.id));
      const nearTop = window.scrollY < 600;
      setPosts((cur) => {
        // Update existing posts in place (reactions, comments, edits) and drop deleted ones.
        const updated = cur.filter((p) => freshIds.has(p.id)).map((p) => ({ ...fresh.find((f) => f.id === p.id)!, isNew: p.isNew }));
        return nearTop ? sortPosts([...incoming.map((p) => ({ ...p, isNew: true })), ...updated]) : sortPosts(updated);
      });
      if (!nearTop && incoming.length) setQueued((q) => [...q, ...incoming.map((p) => ({ ...p, isNew: true }))]);
      setOnline(true);
      setLastSync(Date.now());
    } catch {
      setOnline(false);
    }
  }, []);

  useEffect(() => {
    let t: ReturnType<typeof setInterval> | undefined;
    const start = () => { clearInterval(t); t = setInterval(() => document.visibilityState === "visible" && sync(), POLL_MS); };
    const onVis = () => { if (document.visibilityState === "visible") sync(); };
    start();
    sync();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); window.removeEventListener("online", onVis); };
  }, [sync]);

  // The "new posts" pill bounces in when posts arrive while reading further down.
  useGSAP(() => {
    if (queued.length && pill.current && !isReduced()) {
      gsap.fromTo(pill.current, { y: -40, autoAlpha: 0, scale: 0.8 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.6, ease: "back.out(2)" });
    }
  }, { dependencies: [queued.length] });

  function showQueued() {
    setPosts((cur) => sortPosts([...queued, ...cur.filter((p) => !queued.some((q) => q.id === p.id))]));
    setQueued([]);
    window.scrollTo({ top: 0, behavior: isReduced() ? "auto" : "smooth" });
  }

  const shown = posts.filter((p) => filter === "all" || p.kind === filter);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,640px)_1fr] xl:gap-10">
      {/* Left rail: filters */}
      <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
        <nav aria-label="Filter posts" className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
          {filters.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}
              className={clsx("inline-flex min-h-[44px] shrink-0 items-center rounded-full px-4 text-[15px] font-semibold transition-[background-color,color,transform] duration-100 active:scale-95 lg:w-full", filter === f.id ? "bg-ink text-white" : "bg-white text-ink-soft ring-1 ring-ink/10 hover:text-ink lg:bg-transparent lg:ring-0 lg:hover:bg-ink/5")}>
              {f.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Feed */}
      <div className="relative grid min-w-0 gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LiveBadge lastSync={lastSync} online={online} />
          <p className="text-sm text-ink-mute">New posts and reactions appear automatically.</p>
        </div>
        {queued.length > 0 && (
          <div className="pointer-events-none sticky top-24 z-30 -mb-14 flex justify-center">
            <button ref={pill} type="button" onClick={showQueued} className="pointer-events-auto inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand-500 px-5 font-display font-semibold text-white shadow-lift transition-transform duration-100 hover:scale-105 active:scale-95">
              <ArrowUp className="h-4 w-4" />{queued.length} new {queued.length === 1 ? "post" : "posts"}
            </button>
          </div>
        )}
        <div className="flex items-center gap-4 rounded-4xl bg-brand-500 p-5 text-white">
          <ShieldCheck className="h-8 w-8 shrink-0 text-sun-300" />
          <p className="leading-snug"><b className="font-display text-lg">A safe space for families.</b><br /><span className="text-white/80">Posts come only from verified teachers, and every comment is reviewed before it appears.</span></p>
        </div>
        {shown.length === 0 && <p className="rounded-4xl bg-white p-10 text-center text-ink-mute ring-1 ring-ink/5">No posts here yet.</p>}
        {shown.map((p) => <BlogPost key={p.id} post={p} author={byId[p.authorId]} />)}
      </div>
      {sidebar && <aside className="hidden xl:block xl:sticky xl:top-28 xl:self-start">{sidebar}</aside>}
    </div>
  );
}
