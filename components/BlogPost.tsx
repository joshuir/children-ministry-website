"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import clsx from "clsx";
import { BadgeCheck, CalendarPlus, Clock, Flag, MapPin, Megaphone, MoreHorizontal, Pin, Play, Link2 } from "lucide-react";
import { Avatar, MediaFrame } from "./ui";
import { ReactionBar } from "./ReactionBar";
import { CommentSection } from "./CommentSection";
import { doubleTap, heartPop } from "./emojiFx";
import { fmtDate, timeAgo } from "@/lib/format";
import type { Post, Teacher } from "@/lib/types";

export type FeedPost = Post & { isNew?: boolean };

function PostMenu({ onAction }: { onAction: (a: "report" | "copy") => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("pointerdown", close); window.addEventListener("keydown", esc);
    return () => { window.removeEventListener("pointerdown", close); window.removeEventListener("keydown", esc); };
  }, [open]);
  const item = "flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-semibold text-ink-soft transition-colors duration-100 hover:bg-paper hover:text-ink";
  const act = (a: Parameters<typeof onAction>[0]) => { onAction(a); setOpen(false); };
  return (
    <div className="relative" ref={ref}>
      <button type="button" aria-label="Post options" aria-expanded={open} onClick={() => setOpen(!open)} className="flex h-10 w-10 items-center justify-center rounded-full text-ink-mute transition-colors duration-100 hover:bg-ink/5 hover:text-ink"><MoreHorizontal className="h-5 w-5" /></button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-56 origin-top-right animate-[menu-in_.16s_ease-out] rounded-2xl bg-white p-1.5 shadow-lift ring-1 ring-ink/5">
          <button role="menuitem" className={item} onClick={() => act("copy")}><Link2 className="h-4 w-4" />Copy link</button>
          <button role="menuitem" className={item} onClick={() => act("report")}><Flag className="h-4 w-4" />Report post</button>
        </div>
      )}
    </div>
  );
}

export function BlogPost({ post, author }: { post: FeedPost; author?: Teacher }) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [notice, setNotice] = useState<string>();
  const [playing, setPlaying] = useState(false);
  const mediaRef = useRef<HTMLDivElement>(null);
  const likeTap = useMemo(() => doubleTap(() => {
    if (mediaRef.current) heartPop(mediaRef.current);
    window.dispatchEvent(new CustomEvent("cm:like", { detail: { postId: post.id } }));
  }), [post.id]);
  const input = useRef<HTMLTextAreaElement>(null);
  const card = useRef<HTMLElement>(null);

  // New posts arriving live slide in and glow briefly.
  useGSAP(() => {
    if (!post.isNew || !card.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const tl = gsap.timeline();
    tl.from(card.current, { y: -24, scale: 0.97, autoAlpha: 0, duration: 0.6, ease: "back.out(1.6)" })
      .fromTo(card.current, { boxShadow: "0 0 0 4px rgba(255,197,61,.9)" }, { boxShadow: "0 0 0 0px rgba(255,197,61,0)", duration: 1.6, ease: "power2.out", clearProps: "boxShadow" });
  }, { scope: card, dependencies: [post.isNew] });

  const openComments = () => { setCommentsOpen(true); setTimeout(() => input.current?.focus(), 50); };
  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(undefined), 2600); };

  return (
    <article ref={card} id={post.id} {...(post.isNew ? {} : { "data-reveal": "" })} className="scroll-mt-28 rounded-4xl bg-white p-4 shadow-card ring-1 ring-ink/5 transition-shadow duration-200 sm:p-6 [@media(pointer:fine)]:hover:shadow-lift">
      <header className="flex items-start gap-3">
        <Avatar name={author?.name ?? "Children's Ministry"} tone={author?.tone ?? "blue"} photo={author?.photo} size={48} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-1.5 font-bold text-ink">
            {author?.name ?? "Children's Ministry"} <BadgeCheck className="h-4 w-4 text-brand-500" aria-label="Verified teacher" />
            {post.pinned && <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-sun-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-sun-600"><Pin className="h-3 w-3" />Pinned</span>}
          </p>
          <p className="text-sm text-ink-mute">
            {author?.role} · <time dateTime={post.createdAt} title={fmtDate(post.createdAt.slice(0, 10))} suppressHydrationWarning>{timeAgo(post.createdAt)}</time>
          </p>
        </div>
        <PostMenu
          onAction={async (a) => {
            if (a === "copy") { try { await navigator.clipboard.writeText(`${location.origin}${location.pathname}#${post.id}`); flash("Link copied"); } catch { flash("Couldn't copy link"); } }
            else {
              const reason = window.prompt("What's wrong with this post? (optional)") ?? null;
              if (reason === null) return;
              const ok = await fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: post.id, reason }) }).then((r) => r.ok).catch(() => false);
              flash(ok ? "Thanks — a moderator will review this post." : "Couldn't send the report. Please try again.");
            }
          }}
        />
      </header>

      {post.kind === "announcement" && (
        <div className="mt-4 flex gap-3 rounded-3xl bg-brand-500 p-5 text-white">
          <Megaphone className="h-6 w-6 shrink-0 text-sun-300" />
          <p className="text-[17px] leading-relaxed">{post.body.replace(/^📣\s*/, "")}</p>
        </div>
      )}
      {post.kind !== "announcement" && <p className="mt-4 whitespace-pre-line text-[17px] leading-relaxed text-ink">{post.body}</p>}

      {post.verse && (
        <figure className="relative mt-4 overflow-hidden rounded-3xl bg-ink px-6 py-10 text-center text-white sm:px-10">
          <svg aria-hidden className="absolute -left-4 -top-6 w-28 text-white/5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 7H6a3 3 0 0 0-3 3v4h4v4H3v-4m14-7h-4a3 3 0 0 0-3 3v4h4v4h-4v-4" /></svg>
          <blockquote className="relative font-display text-[calc(var(--h-scale)*clamp(1.6rem,4vw,2.25rem))] font-semibold leading-tight">“{post.verse.text}”</blockquote>
          <figcaption className="relative mt-4 inline-flex rounded-full bg-sun-400 px-4 py-1 text-sm font-bold text-ink">{post.verse.reference}</figcaption>
        </figure>
      )}

      {post.event && (
        <div className="mt-4 flex flex-col gap-4 rounded-3xl bg-sun-100 p-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-white shadow-card">
            <span className="font-display text-2xl font-bold leading-none">{new Date(post.event.date + "T12:00:00Z").getUTCDate()}</span>
            <span className="text-xs font-bold uppercase text-brand-600">{new Date(post.event.date + "T12:00:00Z").toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}</span>
          </div>
          <div className="flex-1">
            <p className="font-display text-xl font-semibold">{post.event.title}</p>
            <p className="mt-1 flex flex-wrap gap-x-4 text-sm font-semibold text-ink-soft"><span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{post.event.time}</span><span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{post.event.location}</span></p>
          </div>
          <a href={icsHref(post.event)} download={`${post.id}.ics`} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white hover:bg-ink-soft"><CalendarPlus className="h-4 w-4" />Add to calendar</a>
        </div>
      )}

      {post.media && (
        <div
          ref={mediaRef}
          className="relative mt-4 select-none overflow-hidden rounded-3xl bg-paper"
          data-cursor={post.kind === "video" ? "Play" : "Like ♥"}
          onPointerUp={post.kind === "video" ? undefined : likeTap}
          title={post.kind === "video" ? undefined : "Double-tap to like"}
        >
          {post.kind === "video" && post.media.src ? (
            <video src={post.media.src} poster={post.media.poster} controls playsInline preload="metadata" className="aspect-video w-full bg-ink object-contain" />
          ) : post.kind === "video" ? (
            <button type="button" onClick={() => setPlaying((p) => !p)} className="group relative block aspect-video w-full" aria-label={playing ? "Pause video" : "Play video"}>
              {post.media?.src ? <video src={post.media.src} poster={post.media.poster} className="h-full w-full object-cover" /> : <MediaFrame media={post.media!} />}
              <span className="absolute inset-0 bg-ink/10 transition-colors group-hover:bg-ink/20" />
              {!playing ? (
                <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-lift transition-transform group-hover:scale-110"><Play className="ml-1 h-8 w-8 fill-ink text-ink" /></span>
              ) : (
                <span className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-2xl bg-ink/80 px-4 py-3 text-left text-sm font-semibold text-white backdrop-blur">
                  <span className="flex h-5 items-end gap-0.5" aria-hidden>{[0, 1, 2, 3].map((i) => <span key={i} className="w-1 rounded-full bg-sun-400 motion-safe:animate-[eq_.9s_ease-in-out_infinite]" style={{ height: `${40 + i * 15}%`, animationDelay: `${i * 0.12}s` }} />)}</span>
                  Preview — the video plays here once it&apos;s uploaded in the admin dashboard.
                </span>
              )}
              {post.media?.duration && <span className="absolute right-3 top-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-bold text-white">{post.media.duration}</span>}
            </button>
          ) : (
            <div className={clsx("w-full", !post.media.src && "aspect-[4/3]")}><MediaFrame media={post.media} className={post.media.src ? "max-h-[620px]" : ""} /></div>
          )}
        </div>
      )}

      <div className="mt-4"><ReactionBar postId={post.id} reactions={post.reactions} commentCount={post.comments.length} onComment={openComments} /></div>
      <CommentSection ref={input} postId={post.id} comments={post.comments} open={commentsOpen} />
      {notice && <p role="status" className="mt-3 rounded-2xl bg-mint-100 px-4 py-2 text-sm font-semibold text-mint-600">{notice}</p>}
    </article>
  );
}

function icsHref(e: NonNullable<Post["event"]>) {
  const d = e.date.replace(/-/g, "");
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Children's Ministry//EN", "BEGIN:VEVENT", `UID:${d}-${e.title.replace(/\W/g, "")}@pcm-kids`, `DTSTART;VALUE=DATE:${d}`, `SUMMARY:${e.title}`, `LOCATION:${e.location}`, `DESCRIPTION:${e.time}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
