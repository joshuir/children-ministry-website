"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { gsap, useGSAP } from "@/lib/gsap";
import { ArrowRight, CalendarDays, CalendarPlus, ChevronLeft, ChevronRight, Clock, Download, LayoutGrid, List, MapPin } from "lucide-react";
import { EVENT_CATEGORIES, categoryLabel, googleCalendarUrl } from "@/lib/calendar";
import { CalendarSync } from "./CalendarSync";
import { dayLabel, dayMonth, fmtDate } from "@/lib/format";
import type { EventItem, Tone } from "@/lib/types";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const toneDot: Record<Tone, string> = { blue: "bg-brand-500", sun: "bg-sun-400", coral: "bg-coral-400", mint: "bg-mint-400", lilac: "bg-lilac-400", ink: "bg-ink" };
const toneRing: Record<Tone, string> = { blue: "ring-brand-500", sun: "ring-sun-400", coral: "ring-coral-400", mint: "ring-mint-400", lilac: "ring-lilac-400", ink: "ring-ink" };
const toneText: Record<Tone, string> = { blue: "text-brand-600", sun: "text-ink", coral: "text-coral-600", mint: "text-mint-600", lilac: "text-lilac-400", ink: "text-ink" };

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

function eventsOn(day: string, list: EventItem[]) {
  return list.filter((e) => e.date <= day && (e.endDate || e.date) >= day);
}

function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Monday first
  const start = new Date(year, month, 1 - offset);
  const weeks = Math.ceil((offset + new Date(year, month + 1, 0).getDate()) / 7);
  return Array.from({ length: weeks * 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

export function EventDetail({ e, address, compact }: { e: EventItem; address: string; compact?: boolean }) {
  const multi = e.endDate && e.endDate !== e.date;
  return (
    <article className={clsx("rounded-4xl bg-white ring-1 ring-ink/5", compact ? "p-4" : "p-5 shadow-card sm:p-6")}>
      <div className="flex items-start gap-3">
        <span className={clsx("mt-1.5 h-3 w-3 shrink-0 rounded-full", toneDot[e.tone])} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-semibold leading-snug">{e.title}</h3>
          <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-ink-soft">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand-500" />{dayLabel(e.date)}{multi ? ` – ${fmtDate(e.endDate!, { day: "numeric", month: "short" })}` : ""}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-brand-500" />{e.time}</span>
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand-500" />{e.location}</span>
          </p>
          {!compact && <p className="mt-3 leading-relaxed text-ink-mute">{e.summary}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={googleCalendarUrl(e, address)} target="_blank" rel="noopener noreferrer" className="btn inline-flex min-h-[40px] items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white transition-colors duration-100 hover:bg-brand-500">
              <CalendarPlus className="h-4 w-4" />Google Calendar
            </a>
            <a href={`/api/calendar?id=${encodeURIComponent(e.id)}`} className="btn inline-flex min-h-[40px] items-center gap-2 rounded-full bg-paper px-4 text-sm font-bold text-ink ring-1 ring-ink/10 transition-colors duration-100 hover:bg-brand-50">
              <Download className="h-4 w-4" />Apple / Outlook
            </a>
            {e.rsvpUrl && (
              <a href={e.rsvpUrl} target="_blank" rel="noopener noreferrer" className="btn inline-flex min-h-[40px] items-center gap-2 rounded-full bg-sun-400 px-4 text-sm font-bold text-ink">RSVP <ArrowRight className="h-4 w-4" /></a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}


/**
 * Compact event display: a subtle circular icon (the date, ringed in the event's colour, or its photo)
 * with the event name underneath. Tapping one opens its details.
 */
export function EventOrbs({ events, activeId, onPick, label = "Upcoming events" }: { events: EventItem[]; activeId?: string | null; onPick: (e: EventItem) => void; label?: string }) {
  const row = useRef<HTMLUListElement>(null);
  useGSAP(() => {
    if (!row.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo(row.current.querySelectorAll("[data-orb]"), { autoAlpha: 0, y: 10, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.6)", stagger: 0.05 });
  }, { scope: row, dependencies: [events.map((e) => e.id).join()] });
  if (!events.length) return null;
  return (
    <ul ref={row} aria-label={label} className="scrollbar-none -mx-1 flex snap-x gap-1 overflow-x-auto px-1 pb-1 pt-1 sm:gap-2">
      {events.map((e) => {
        const d = dayMonth(e.date);
        const on = activeId === e.id;
        return (
          <li key={e.id} data-orb className="w-[84px] shrink-0 snap-start sm:w-[96px]">
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onPick(e)}
              title={`${e.title} · ${dayLabel(e.date)}`}
              className="group flex w-full flex-col items-center gap-2 rounded-3xl px-1 py-2 text-center transition-colors duration-200 hover:bg-white/70 focus-visible:bg-white"
            >
              <span className={clsx("relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-offset-2 ring-offset-transparent transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105 sm:h-16 sm:w-16", toneRing[e.tone], on && "scale-105 shadow-lift")}>
                {e.image?.src && !/\.(mp4|webm|mov)$/i.test(e.image.src)
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={e.image.src} alt="" loading="lazy" className="h-full w-full object-cover" />
                  : <span className="flex flex-col items-center leading-none"><b className={clsx("font-display text-xl font-extrabold sm:text-2xl", toneText[e.tone])}>{d.day}</b><span className="mt-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-ink-mute">{d.month}</span></span>}
                <span className={clsx("absolute bottom-0.5 right-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white", toneDot[e.tone])} aria-hidden />
              </span>
              <span className={clsx("line-clamp-2 text-[12px] font-bold leading-tight sm:text-[13px]", on ? "text-brand-600" : "text-ink")}>{e.title}</span>
              <span className="sr-only">{categoryLabel(e.category)}, {dayLabel(e.date)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function EventsCalendar({ events, address, mode = "full", initialMonth, calendarName = "Children's Ministry" }: { events: EventItem[]; address: string; mode?: "full" | "mini"; initialMonth: string; calendarName?: string }) {
  // The page may be pre-rendered on an earlier day, so "today" is only known after mounting.
  const [today, setToday] = useState("");
  const [cursor, setCursor] = useState(() => ({ y: Number(initialMonth.slice(0, 4)), m: Number(initialMonth.slice(5, 7)) - 1 }));
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<"month" | "list">("month");
  const [cats, setCats] = useState<string[]>([]);
  const grid = useRef<HTMLDivElement>(null);
  const dir = useRef(0);
  const [focusId, setFocusId] = useState<string | null>(null);

  // Pick a sensible starting day: today if something is on, else the next event this month.
  useEffect(() => {
    const now = new Date();
    const t = iso(now);
    setToday(t);
    setCursor({ y: now.getFullYear(), m: now.getMonth() });
    const firstUpcoming = events.find((e) => (e.endDate || e.date) >= t)?.date;
    if (eventsOn(t, events).length) setSelected(t);
    else if (firstUpcoming && firstUpcoming.slice(0, 7) === t.slice(0, 7)) setSelected(firstUpcoming);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => (cats.length ? events.filter((e) => cats.includes(e.category || "special")) : events), [events, cats]);
  const days = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);
  const monthLabel = new Date(cursor.y, cursor.m, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const monthEvents = filtered.filter((e) => {
    const start = `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-01`;
    const end = iso(new Date(cursor.y, cursor.m + 1, 0));
    return e.date <= end && (e.endDate || e.date) >= start;
  });

  function pick(e: EventItem) {
    const [y, m] = e.date.split("-").map(Number);
    dir.current = 0;
    setCursor({ y, m: m - 1 });
    setSelected(e.date);
    setFocusId(e.id);
  }

  function go(delta: number) {
    dir.current = delta;
    setCursor((c) => { const d = new Date(c.y, c.m + delta, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
    setSelected(null);
    setFocusId(null);
  }
  function goToday() {
    const d = new Date();
    dir.current = 0;
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
    setSelected(iso(d));
  }

  useGSAP(() => {
    if (!grid.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cells = grid.current.querySelectorAll("[data-cell]");
    gsap.fromTo(cells, { x: dir.current * 24, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.35, ease: "power2.out", stagger: { each: 0.008, from: dir.current < 0 ? "end" : "start" } });
  }, { scope: grid, dependencies: [cursor, view] });

  const selectedEvents = selected ? eventsOn(selected, filtered) : [];
  const upcoming = filtered.filter((e) => (e.endDate || e.date) >= (today || initialMonth + "-01"));
  const mini = mode === "mini";

  const calendar = (
    <div className={clsx("rounded-5xl bg-white ring-1 ring-ink/5", mini ? "p-4 sm:p-5" : "p-3 shadow-card sm:p-6")}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 pb-4">
        <h2 className={clsx("font-display font-bold tracking-tight", mini ? "text-xl" : "text-2xl sm:text-3xl")} aria-live="polite">{monthLabel}</h2>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={goToday} className="btn min-h-[40px] rounded-full bg-paper px-4 text-sm font-bold ring-1 ring-ink/10">Today</button>
          <button type="button" onClick={() => go(-1)} aria-label="Previous month" className="btn flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white"><ChevronLeft className="h-5 w-5" /></button>
          <button type="button" onClick={() => go(1)} aria-label="Next month" className="btn flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white"><ChevronRight className="h-5 w-5" /></button>
        </div>
      </div>
      <div role="grid" aria-label={`Events in ${monthLabel}`} ref={grid}>
        <div role="row" className="grid grid-cols-7 pb-2">
          {DOW.map((d) => <div role="columnheader" key={d} className="text-center text-[11px] font-bold uppercase tracking-[0.08em] text-ink-mute sm:text-xs">{mini ? d[0] : d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {days.map((d) => {
            const key = iso(d);
            const inMonth = d.getMonth() === cursor.m;
            const on = eventsOn(key, filtered);
            const isToday = key === today, isSel = key === selected;
            return (
              <button
                key={key}
                type="button"
                role="gridcell"
                data-cell
                aria-selected={isSel}
                aria-label={`${dayLabel(key, true)}${on.length ? `, ${on.length} event${on.length > 1 ? "s" : ""}: ${on.map((e) => e.title).join(", ")}` : ""}`}
                onClick={() => { setSelected(isSel ? null : key); setFocusId(null); }}
                className={clsx(
                  "group relative flex flex-col items-stretch rounded-xl p-1 text-left transition-[background-color,box-shadow,transform] duration-100 active:scale-95 sm:rounded-2xl",
                  mini ? "min-h-[44px] items-center justify-center" : "min-h-[56px] sm:min-h-[96px] sm:p-2",
                  isSel ? "bg-brand-500 text-white shadow-lift" : on.length ? "bg-brand-50 hover:bg-brand-100" : "hover:bg-paper",
                  !inMonth && !isSel && "opacity-40",
                )}
              >
                <span className={clsx("flex h-7 w-7 items-center justify-center self-center rounded-full font-display text-sm font-bold sm:self-start", isToday && !isSel && "bg-ink text-white", isToday && isSel && "bg-white text-brand-600")}>{d.getDate()}</span>
                {on.length > 0 && (
                  <>
                    <span className={clsx("mt-1 flex justify-center gap-0.5", !mini && "sm:hidden")}>{on.slice(0, 3).map((e) => <span key={e.id} className={clsx("h-1.5 w-1.5 rounded-full", isSel ? "bg-white" : toneDot[e.tone])} />)}</span>
                    {!mini && (
                      <span className="mt-1 hidden flex-col items-center gap-1 sm:flex">
                        <span className="flex -space-x-1.5">{on.slice(0, 3).map((e) => <span key={e.id} className={clsx("h-5 w-5 rounded-full ring-2", isSel ? "bg-white/90 ring-brand-500" : clsx(toneDot[e.tone], "ring-white"))} />)}</span>
                        <span className={clsx("line-clamp-2 w-full text-center text-[11px] font-bold leading-tight", isSel ? "text-white" : "text-ink-soft")}>{on[0].title}{on.length > 1 ? ` +${on.length - 1}` : ""}</span>
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (mini) {
    const show = selected ? selectedEvents : monthEvents;
    const focus = show.find((e) => e.id === focusId) ?? show[0];
    return (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,420px)_1fr]">
        <div data-reveal>{calendar}</div>
        <div className="grid content-start gap-4">
          <p className="px-1 text-sm font-bold uppercase tracking-[0.08em] text-ink-mute">
            {selected ? dayLabel(selected, true) : `In ${monthLabel.split(" ")[0]}`}
          </p>
          {show.length ? (
            <>
              <EventOrbs events={show.slice(0, 8)} activeId={focus?.id} onPick={pick} label={`Events ${selected ? "on the chosen day" : "this month"}`} />
              {focus && <div key={focus.id} data-reveal><EventDetail e={focus} address={address} /></div>}
            </>
          ) : (
            <p className="rounded-4xl bg-white p-6 text-ink-mute ring-1 ring-ink/5">Nothing planned {selected ? "that day" : "this month"} yet — tap another date, or see everything on the events page.</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/events/" className="btn btn-dark inline-flex min-h-[48px] items-center gap-2 rounded-full bg-ink px-6 font-display font-semibold text-white"><span className="btn-label">Full calendar</span> <ArrowRight className="h-4 w-4" /></Link>
            <CalendarSync name={calendarName} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {upcoming.length > 0 && (
        <div className="rounded-5xl bg-white p-4 ring-1 ring-ink/5 sm:p-5">
          <p className="px-2 pb-2 text-sm font-bold uppercase tracking-[0.08em] text-ink-mute">Coming up</p>
          <EventOrbs events={upcoming.slice(0, 10)} activeId={focusId} onPick={(e) => { pick(e); setView("month"); }} />
        </div>
      )}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="Filter by type" className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
          <button type="button" aria-pressed={!cats.length} onClick={() => setCats([])} className={clsx("min-h-[44px] shrink-0 rounded-full px-4 text-[15px] font-semibold transition-colors duration-100 active:scale-95", !cats.length ? "bg-ink text-white" : "bg-white ring-1 ring-ink/10 hover:bg-brand-50")}>All</button>
          {EVENT_CATEGORIES.filter((c) => events.some((e) => (e.category || "special") === c.id)).map((c) => {
            const on = cats.includes(c.id);
            return <button key={c.id} type="button" aria-pressed={on} onClick={() => setCats((s) => (on ? s.filter((x) => x !== c.id) : [...s, c.id]))} className={clsx("min-h-[44px] shrink-0 rounded-full px-4 text-[15px] font-semibold transition-colors duration-100 active:scale-95", on ? "bg-brand-500 text-white" : "bg-white ring-1 ring-ink/10 hover:bg-brand-50")}>{c.label}</button>;
          })}
        </div>
        <div className="flex items-center gap-2">
          <div role="radiogroup" aria-label="View" className="flex rounded-full bg-white p-1 ring-1 ring-ink/10">
            {([["month", LayoutGrid, "Month"], ["list", List, "List"]] as const).map(([v, Icon, label]) => (
              <button key={v} type="button" role="radio" aria-checked={view === v} onClick={() => setView(v)} className={clsx("inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-4 text-sm font-bold transition-colors duration-100", view === v ? "bg-ink text-white" : "text-ink-soft hover:text-ink")}><Icon className="h-4 w-4" />{label}</button>
            ))}
          </div>
          <CalendarSync name={calendarName} />
        </div>
      </div>

      {view === "month" ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          {calendar}
          <aside className="grid content-start gap-4" aria-live="polite">
            <p className="px-1 text-sm font-bold uppercase tracking-[0.08em] text-ink-mute">{selected ? dayLabel(selected, true) : `All of ${monthLabel}`}</p>
            {[...(selected ? selectedEvents : monthEvents)].sort((a, b) => Number(b.id === focusId) - Number(a.id === focusId)).map((e) => <EventDetail key={e.id} e={e} address={address} />)}
            {(selected ? selectedEvents : monthEvents).length === 0 && <p className="rounded-4xl bg-white p-6 text-ink-mute ring-1 ring-ink/5">No events {selected ? "on this day" : "this month"}. Try the next month →</p>}
          </aside>
        </div>
      ) : (
        <div ref={grid} className="grid gap-8">
          {upcoming.length === 0 && <p className="rounded-4xl bg-white p-8 text-ink-mute ring-1 ring-ink/5">No upcoming events yet — check back soon.</p>}
          {Object.entries(upcoming.reduce<Record<string, EventItem[]>>((acc, e) => { const k = e.date.slice(0, 7); (acc[k] ||= []).push(e); return acc; }, {})).map(([k, list]) => (
            <section key={k} data-cell>
              <h2 className="mb-3 font-display text-2xl font-bold">{parse(k + "-01").toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</h2>
              <div className="grid gap-4 md:grid-cols-2">{list.map((e) => <EventDetail key={e.id} e={e} address={address} />)}</div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
