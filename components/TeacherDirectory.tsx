"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { gsap, useGSAP, Flip } from "@/lib/gsap";
import { BookOpen, CalendarHeart, Mail, ShieldCheck, Sparkles, X } from "lucide-react";
import { TeacherCard, TeacherPortrait } from "./TeacherCard";
import type { ClassInfo, GroupInfo, Teacher } from "@/lib/types";


export function Profile({ t, classes, onClose }: { t: Teacher; classes: ClassInfo[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const theirs = classes.filter((c) => t.classIds.includes(c.id));

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeBtn.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("a,button");
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; prev?.focus(); };
  }, [onClose]);

  useGSAP(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(ref.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
    gsap.fromTo(panel.current, { y: 40, scale: 0.96, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.45, ease: "back.out(1.6)" });
    gsap.from("[data-stagger]", { y: 14, autoAlpha: 0, duration: 0.4, stagger: 0.05, delay: 0.12, ease: "power2.out" });
  }, { scope: ref });

  return (
    <div ref={ref} className="fixed inset-0 z-[80] flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="teacher-dialog-title" className="relative grid max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-[2rem] bg-white p-4 shadow-lift sm:rounded-[2rem] sm:p-6 md:grid-cols-[260px_1fr] md:gap-8">
        <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close profile" className="btn absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white"><X className="h-5 w-5" /></button>
        <div className="mx-auto w-full max-w-[260px]"><TeacherPortrait teacher={t} big /></div>
        <div className="mt-5 md:mt-2">
          <p data-stagger className="text-sm font-bold uppercase tracking-[0.08em] text-brand-600">{t.role}</p>
          <h3 id="teacher-dialog-title" data-stagger className="mt-1 font-display text-4xl font-bold tracking-tight">{t.name}</h3>
          <p data-stagger className="mt-4 text-lg leading-relaxed text-ink-soft">{t.bio}</p>
          {t.favouriteVerse?.text && (
            <figure data-stagger className="mt-5 rounded-3xl bg-ink p-5 text-white">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-sun-300"><BookOpen className="h-4 w-4" />Favourite verse</p>
              <blockquote className="mt-2 font-display text-xl font-semibold leading-snug">“{t.favouriteVerse.text}”</blockquote>
              <figcaption className="mt-2 text-sm font-bold text-white/60">{t.favouriteVerse.reference}</figcaption>
            </figure>
          )}
          <dl data-stagger className="mt-5 grid gap-3 sm:grid-cols-2">
            {t.funFact && <div className="rounded-3xl bg-sun-100 p-4"><dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-sun-600"><Sparkles className="h-4 w-4" />Fun fact</dt><dd className="mt-1 font-semibold leading-snug">{t.funFact}</dd></div>}
            <div className="rounded-3xl bg-brand-50 p-4"><dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-brand-700"><CalendarHeart className="h-4 w-4" />Serving</dt><dd className="mt-1 font-semibold leading-snug">{t.since ? `Since ${t.since}` : "Children's Ministry team"}{t.checked !== false && <span className="mt-1 flex items-center gap-1 text-sm text-ink-mute"><ShieldCheck className="h-4 w-4 text-brand-600" />Safeguarding trained & checked</span>}</dd></div>
          </dl>
          <div data-stagger className="mt-5 flex flex-wrap gap-2">
            {theirs.map((c) => <Link key={c.id} href={`/classes/${c.id}/`} className="btn inline-flex min-h-[44px] items-center rounded-full bg-paper px-4 text-sm font-bold ring-1 ring-ink/10">{c.name} · {c.room}</Link>)}
            <Link href="/contact/" className="btn inline-flex min-h-[44px] items-center gap-2 rounded-full bg-brand-500 px-5 text-sm font-bold text-white"><Mail className="h-4 w-4" />Message via the office</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TeacherDirectory({ teachers, classes, groups }: { teachers: Teacher[]; classes: ClassInfo[]; groups: GroupInfo[] }) {
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState<Teacher | null>(null);
  const grid = useRef<HTMLUListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const close = useCallback(() => setOpen(null), []);

  const lead = teachers.find((t) => t.featured);
  const groupOf = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c.group])), [classes]);
  const matches = (t: Teacher) => (filter === "all" ? !t.featured : false) || (filter === "team" ? t.classIds.length === 0 || t.featured : t.classIds.some((id) => groupOf[id] === filter));
  const chips = [{ id: "all", label: "Everyone" }, ...groups.map((g) => ({ id: g.id, label: g.name })), { id: "team", label: "Leadership" }];

  useEffect(() => {
    const id = new URLSearchParams(location.search).get("teacher");
    const t = teachers.find((x) => x.id === id);
    if (t) setOpen(t);
  }, [teachers]);

  function choose(id: string) {
    if (grid.current) flipState.current = Flip.getState(grid.current.querySelectorAll("[data-flip]"));
    setFilter(id);
  }
  useGSAP(() => {
    if (!flipState.current || matchMedia("(prefers-reduced-motion: reduce)").matches) { flipState.current = null; return; }
    Flip.from(flipState.current, {
      duration: 0.5, ease: "power3.inOut", absolute: true, scale: true,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.4 }),
      onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.85, duration: 0.3 }),
    });
    flipState.current = null;
  }, { scope: grid, dependencies: [filter] });

  return (
    <div>
      {lead && (
        <div data-reveal className="mb-12 grid items-center gap-8 overflow-hidden rounded-[2.5rem] bg-ink p-4 text-white sm:p-6 md:grid-cols-[minmax(0,320px)_1fr] md:gap-12 md:p-8">
          <button type="button" onClick={() => setOpen(lead)} className="group block w-full max-w-[320px] rounded-[1.75rem] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-sun-400" aria-label={`Open ${lead.name}'s profile`} data-card>
            <TeacherPortrait teacher={lead} big />
          </button>
          <div className="pb-2">
            <p className="inline-flex rounded-full bg-sun-400 px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] text-ink">Leading the ministry</p>
            <h3 className="mt-4 font-display text-[calc(var(--h-scale)*clamp(2rem,4vw,3rem))] font-bold leading-none tracking-tight">{lead.name}</h3>
            <p className="mt-2 font-semibold text-white/60">{lead.role}{lead.since ? ` · serving since ${lead.since}` : ""}</p>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/85">{lead.bio}</p>
            {lead.favouriteVerse?.text && <p className="mt-5 max-w-xl border-l-4 border-sun-400 pl-4 font-display text-lg italic text-white/90">“{lead.favouriteVerse.text}” <span className="not-italic text-white/50">— {lead.favouriteVerse.reference}</span></p>}
            <button type="button" onClick={() => setOpen(lead)} className="btn mt-7 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-white px-6 font-display font-semibold text-ink">Read full profile</button>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="Filter teachers by class group" className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
          {chips.map((c) => (
            <button key={c.id} type="button" aria-pressed={filter === c.id} onClick={() => choose(c.id)}
              className={clsx("min-h-[44px] shrink-0 rounded-full px-4 text-[15px] font-semibold transition-[background-color,color,transform] duration-100 active:scale-95", filter === c.id ? "bg-ink text-white" : "bg-paper text-ink-soft ring-1 ring-ink/10 hover:bg-brand-50 hover:text-ink")}>
              {c.label}
            </button>
          ))}
        </div>
        <p className="flex items-center gap-2 text-sm font-semibold text-ink-mute"><ShieldCheck className="h-5 w-5 text-brand-500" />Every teacher is trained and background-checked</p>
      </div>

      <ul ref={grid} className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4" aria-live="polite">
        {teachers.filter(matches).map((t) => (
          <li key={t.id} data-flip data-flip-id={t.id}>
            <TeacherCard teacher={t} classes={classes} onOpen={() => setOpen(t)} />
          </li>
        ))}
      </ul>

      {open && <Profile t={open} classes={classes} onClose={close} />}
    </div>
  );
}
