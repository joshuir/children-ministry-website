"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { gsap, useGSAP } from "@/lib/gsap";
import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { TeacherPortrait } from "./TeacherCard";
import { Profile } from "./TeacherDirectory";
import type { ClassInfo, GroupInfo, SectionText, Teacher } from "@/lib/types";

/**
 * "Meet the team" in the style of an architecture studio site:
 * a giant headline, a long list of very large names with small role labels,
 * and a sticky portrait + credentials that switch as you hover or tap a name.
 */
export function TeamShowcase({ teachers, classes, groups, text, limit, cta }: {
  teachers: Teacher[]; classes: ClassInfo[]; groups: GroupInfo[]; text: SectionText; limit?: number; cta?: { href: string; label: string };
}) {
  const [filter, setFilter] = useState("all");
  const ordered = useMemo(() => [...teachers.filter((t) => t.featured), ...teachers.filter((t) => !t.featured)], [teachers]);
  const groupOf = useMemo(() => Object.fromEntries(classes.map((c) => [c.id, c.group])), [classes]);
  const shown = ordered.filter((t) => filter === "all" || (filter === "team" ? t.classIds.length === 0 : t.classIds.some((id) => groupOf[id] === filter))).slice(0, limit ?? 99);
  const [activeId, setActiveId] = useState(ordered[0]?.id);
  const active = shown.find((t) => t.id === activeId) ?? shown[0];
  const [open, setOpen] = useState<Teacher | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const photo = useRef<HTMLDivElement>(null);
  const info = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const chips = limit ? [] : [{ id: "all", label: "All" }, ...groups.map((g) => ({ id: g.id, label: g.name })), { id: "team", label: "Leadership" }];

  useEffect(() => {
    const id = new URLSearchParams(location.search).get("teacher");
    const t = teachers.find((x) => x.id === id);
    if (t) { setActiveId(t.id); setOpen(t); }
  }, [teachers]);

  // Portrait wipes in and the credentials slide up each time the active name changes.
  useGSAP(() => {
    if (first.current) { first.current = false; return; }
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (photo.current) gsap.fromTo(photo.current, { clipPath: "inset(0 0 100% 0 round 24px)" }, { clipPath: "inset(0 0 0% 0 round 24px)", duration: 0.6, ease: "expo.out", overwrite: true });
    if (info.current) gsap.fromTo(info.current.children, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.4, stagger: 0.04, ease: "power2.out", overwrite: true });
  }, { dependencies: [active?.id] });

  const creds = (t: Teacher) => {
    const theirs = classes.filter((c) => t.classIds.includes(c.id)).map((c) => c.name);
    return [
      ...(t.credentials?.filter(Boolean) ?? []),
      t.since && `Serving since ${t.since}`,
      theirs.length ? theirs.join(" · ") : "Ministry leadership",
    ].filter(Boolean) as string[];
  };

  const details = (t: Teacher, inline?: boolean) => (
    <div className={clsx(inline ? "grid gap-4 pb-6 pt-2 sm:grid-cols-[200px_1fr]" : "")}>
      <div ref={inline ? undefined : photo} className={clsx("overflow-hidden rounded-[1.5rem]", inline && "max-w-[220px]")}>
        <TeacherPortrait teacher={t} big className="!rounded-[1.5rem]" />
      </div>
      <div ref={inline ? undefined : info} className={clsx(!inline && "mt-5")}>
        {!inline && <p className="font-display text-xl font-extrabold uppercase tracking-tight text-ink">{t.name}</p>}
        {!inline && <p className="text-sm font-bold uppercase tracking-[0.08em] text-ink-mute">{t.role}</p>}
        <ul className={clsx(!inline && "mt-3", " grid gap-0.5 text-[15px] font-semibold leading-snug text-ink-soft")}>
          {creds(t).map((c) => <li key={c}>{c}</li>)}
          {t.checked !== false && <li className="flex items-center gap-1.5 text-brand-700"><ShieldCheck className="h-4 w-4" />Safeguarding trained &amp; checked</li>}
        </ul>
        <button type="button" onClick={() => setOpen(t)} className="btn mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-ink px-5 text-sm font-extrabold uppercase tracking-[0.06em] text-white">
          Full profile <span className="h-2.5 w-2.5 rounded-full ring-2 ring-white" />
        </button>
      </div>
    </div>
  );

  if (!active) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-10 grid gap-6 md:mb-16 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p data-reveal className="mb-4 text-sm font-extrabold uppercase tracking-[0.14em] text-ink-mute">({text.eyebrow || "Our team"})</p>
          <h2 data-split className="max-w-[14ch] font-display text-[calc(var(--h-scale)*clamp(2.75rem,8vw,7rem))] font-extrabold uppercase leading-[0.88] tracking-[-0.04em] text-ink">{text.title}</h2>
        </div>
        <div data-reveal className="flex flex-col items-start gap-4 lg:items-end lg:text-right">
          {text.body && <p className="max-w-xs text-lg font-semibold leading-snug text-ink-soft">{text.body}</p>}
          <Link href={cta?.href || "/contact/"} className="btn inline-flex min-h-[48px] items-center gap-3 rounded-full bg-ink pl-6 pr-2 font-display font-extrabold uppercase tracking-[0.04em] text-white">
            {cta?.label || "Get in touch"}<span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink"><ArrowUpRight className="h-4 w-4" /></span>
          </Link>
        </div>
      </div>

      {chips.length > 0 && (
        <div role="group" aria-label="Filter the team" className="scrollbar-none -mx-5 mb-8 flex gap-1 overflow-x-auto px-5 md:mx-0 md:px-0">
          {chips.map((c) => (
            <button key={c.id} type="button" aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}
              className={clsx("min-h-[40px] shrink-0 rounded-full px-4 text-sm font-extrabold uppercase tracking-[0.08em] transition-colors duration-100", filter === c.id ? "bg-ink text-white" : "text-ink-mute hover:bg-ink/5 hover:text-ink")}>
              ({c.label})
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Name list */}
        <ul className="min-w-0" aria-label="Team members">
          {shown.map((t) => {
            const on = t.id === active.id;
            return (
              <li key={t.id} className="border-b border-ink/10 last:border-0 lg:border-0">
                <button
                  type="button"
                  aria-expanded={on}
                  onMouseEnter={() => matchMedia("(hover: hover)").matches && setActiveId(t.id)}
                  onFocus={() => setActiveId(t.id)}
                  data-cursor="Profile"
                  onClick={() => (matchMedia("(min-width: 1024px)").matches ? setOpen(t) : setActiveId(on ? "" : t.id))}
                  className="group grid w-full grid-cols-1 items-baseline gap-x-6 py-2 text-left sm:grid-cols-[150px_minmax(0,1fr)] lg:py-1"
                >
                  <span className={clsx("order-2 text-xs font-extrabold uppercase tracking-[0.1em] transition-colors duration-200 sm:order-1 sm:text-right", on ? "text-ink-mute" : "text-ink/30")}>{t.role}</span>
                  <span className={clsx("order-1 block font-display [overflow-wrap:anywhere] text-[calc(var(--h-scale)*clamp(2rem,5.4vw,4.75rem))] font-extrabold uppercase leading-[0.98] tracking-[-0.03em] transition-[color,transform] duration-300 sm:order-2", on ? "text-ink lg:translate-x-2" : "text-ink/30 group-hover:text-ink/50 lg:text-ink/15")}>
                    {t.name}
                  </span>
                </button>
                {/* phones/tablets: details open under the name */}
                {on && <div className="lg:hidden">{details(t, true)}</div>}
              </li>
            );
          })}
          {limit && cta && (
            <li className="pt-6"><Link href={cta.href} className="inline-flex items-center gap-2 font-display text-lg font-extrabold uppercase tracking-tight text-brand-600 hover:text-ink">See all {teachers.length} teachers <ArrowRight className="h-5 w-5" /></Link></li>
          )}
        </ul>

        {/* Sticky portrait + credentials (desktop) */}
        <aside className="hidden lg:block" aria-live="polite">
          <div className="sticky top-28">{details(active)}</div>
        </aside>
      </div>

      {open && <Profile t={open} classes={classes} onClose={close} />}
    </div>
  );
}
