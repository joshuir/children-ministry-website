"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  BookOpen, CalendarCheck, Check, Clock, Crown, Flame, Heart, Link2, Lock, MapPinned, PenLine, Puzzle, RotateCcw, Settings,
  Sparkles, SpellCheck, Star, Target, TextCursorInput, Trophy, Users, Zap,
} from "lucide-react";
import { gsap, useGSAP, ScrollTrigger } from "@/lib/gsap";
import { isReduced } from "@/lib/motion-pref";
import { LEVELS, SECTIONS } from "@/content/learn";
import {
  BADGES, GOALS, HEART_MS, MAX_HEARTS, challengeValue, dayOf, emptyProgress, journey, loadProgress, resetProgress, saveProgress,
  todaysChallenges, weekKey, type JourneyNode, type Progress,
} from "@/lib/learn";
import type { LearnCategory, LearnChallenge, LearnIcon, LearnLesson, QuizQuestion } from "@/lib/types";
import { Mascot } from "./Mascot";
import { BadgeIcon } from "./BadgeIcon";

const ICONS: Record<LearnIcon, typeof BookOpen> = { book: BookOpen, sparkles: Sparkles, users: Users, map: MapPinned, pen: PenLine, puzzle: Puzzle, spell: SpellCheck, link: Link2, clock: Clock, blank: TextCursorInput };
const FILL: Record<string, string> = {
  blue: "bg-brand-500 text-white shadow-[0_7px_0_0_#173EA8]", sun: "bg-sun-400 text-ink shadow-[0_7px_0_0_#B7791F]", coral: "bg-coral-400 text-white shadow-[0_7px_0_0_#C9512F]",
  mint: "bg-mint-400 text-ink shadow-[0_7px_0_0_#1565C0]", lilac: "bg-lilac-400 text-white shadow-[0_7px_0_0_#0B1530]",
};
const BANNER: Record<string, string> = { blue: "bg-brand-500 text-white", sun: "bg-sun-400 text-ink", coral: "bg-coral-400 text-white", mint: "bg-mint-400 text-ink", lilac: "bg-lilac-400 text-white" };
const RING: Record<string, string> = { blue: "#2563EB", sun: "#E9A100", coral: "#FF7A59", mint: "#1565C0", lilac: "#1E3A8A" };
// stepping-stone offsets for the path (px at full size, scaled down on phones)
const ZIG = [0, 70, 110, 70, 0, -70, -110, -70];

type Tab = "journey" | "today" | "badges" | "league";
type League = { week: string; teams: Record<string, number> };

export function LearnHub({ bank, lessons, categories, challenges }: { bank: QuizQuestion[]; lessons: LearnLesson[]; categories: LearnCategory[]; challenges: LearnChallenge[] }) {
  const [p, setP] = useState<Progress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState<Tab>("journey");
  const [open, setOpen] = useState<string | null>(null);
  const [league, setLeague] = useState<League | null>(null);
  const [, tick] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const cats = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  useEffect(() => {
    const prog = loadProgress();
    saveProgress(prog);
    setP(prog); setReady(true);
    fetch("/api/learn/league").then((r) => (r.ok ? r.json() : null)).then((d) => d && setLeague(d)).catch(() => {});
    const t = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const update = (next: Progress) => { setP(next); saveProgress(next); };
  const nodes = useMemo(() => journey(bank, lessons, p), [bank, lessons, p]);
  const current = nodes.find((n) => n.state === "current");
  // computed after mount only: the page is prerendered, so "today" must come from the visitor's clock
  const today = useMemo(() => (ready ? todaysChallenges(challenges, dayOf()) : []), [challenges, ready]);
  const ctx = { bank, lessons, categories };
  const missed = Object.keys(p.missed).length;
  const greeting = !ready ? "" : p.streak >= 2 ? `${p.streak} days in a row — amazing!` : p.dayXp >= p.goal ? "Daily goal done! Keep growing!" : current ? `Next up: ${current.lesson.title}!` : "You finished the whole journey!";

  /* ---------- scroll & entrance animations */
  useGSAP(() => {
    if (!ready || !root.current) return;
    const calm = isReduced();
    const q = gsap.utils.selector(root.current);
    if (calm) { gsap.set(q("[data-node], [data-banner], [data-panel]"), { autoAlpha: 1 }); return; }
    gsap.set(q("[data-node]"), { autoAlpha: 0, scale: 0.5, y: 24 });
    const batch = ScrollTrigger.batch(q("[data-node]"), {
      start: "top 92%", once: true,
      onEnter: (els) => gsap.to(els, { autoAlpha: 1, scale: 1, y: 0, duration: 0.55, ease: "back.out(1.8)", stagger: 0.07 }),
    });
    q("[data-banner]").forEach((b) => gsap.fromTo(b, { autoAlpha: 0, x: -30 }, { autoAlpha: 1, x: 0, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: b, start: "top 90%", once: true } }));
    gsap.fromTo(q("[data-panel]"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.08 });
    // the current lesson breathes so children can find it
    const pulse = gsap.to(q("[data-current-ring]"), { scale: 1.18, autoAlpha: 0, duration: 1.4, ease: "power1.out", repeat: -1 });
    // scrolling drifts the background clouds (desktop)
    const clouds = q("[data-cloud]").map((c, i) => gsap.to(c, { yPercent: -40 - i * 25, ease: "none", scrollTrigger: { trigger: root.current, start: "top top", end: "bottom bottom", scrub: 0.8 } }));
    // bring the current lesson into view the first time
    const cur = q("[data-state=current]")[0];
    if (cur && window.scrollY < 100) setTimeout(() => cur.scrollIntoView({ behavior: "smooth", block: "center" }), 600);
    return () => { batch.forEach((b) => b.kill()); pulse.kill(); clouds.forEach((c) => c.kill()); };
  }, { scope: root, dependencies: [ready, tab, p.ageGroup] });

  useGSAP(() => {
    if (!open || isReduced()) return;
    gsap.fromTo(`[data-pop="${open}"]`, { autoAlpha: 0, y: -8, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.3, ease: "back.out(2)" });
  }, { scope: root, dependencies: [open] });

  const heartWait = p.hearts < MAX_HEARTS ? Math.max(0, p.heartAt + HEART_MS - Date.now()) : 0;
  const mmss = `${Math.floor(heartWait / 60000)}:${String(Math.floor((heartWait % 60000) / 1000)).padStart(2, "0")}`;
  const goalPct = Math.min(1, p.dayXp / Math.max(1, p.goal));

  /* ---------- panels */
  const Stats = (
    <div className="grid grid-cols-4 gap-2 rounded-3xl bg-white p-2 ring-1 ring-ink/5 sm:gap-3 sm:p-3">
      <Stat icon={<Flame className={clsx("h-6 w-6", p.goalDay === dayOf() ? "fill-coral-400 text-coral-400" : "text-ink/30")} />} value={ready ? p.streak : "–"} label="Streak" />
      <Stat icon={<Zap className="h-6 w-6 fill-sun-400 text-sun-600" />} value={ready ? p.xp : "–"} label="XP" />
      <Stat icon={<Heart className="h-6 w-6 fill-coral-400 text-coral-400" />} value={ready ? p.hearts : "–"} label={heartWait ? `+1 in ${mmss}` : "Hearts"} />
      <div className="flex flex-col items-center justify-center gap-0.5 rounded-2xl py-2 text-center" title={`${p.dayXp} of ${p.goal} XP today`}>
        <Ring pct={ready ? goalPct : 0} />
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-mute">{ready ? `${Math.min(p.dayXp, p.goal)}/${p.goal}` : "Goal"}</span>
      </div>
    </div>
  );

  const Today = (
    <div className="grid gap-4">
      <Link href="/learn/play/daily/" data-panel className={clsx("group relative overflow-hidden rounded-4xl p-5 text-white", p.dailyQuizDay === dayOf() ? "bg-mint-600" : "bg-brand-500")}>
        <span aria-hidden className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-125" />
        <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em] text-white/80"><CalendarCheck className="h-4 w-4" />Daily quiz</p>
        <p className="mt-1 font-display text-2xl font-bold">{p.dailyQuizDay === dayOf() ? "Done for today!" : "5 new questions"}</p>
        <p className="mt-1 text-white/85">{p.dailyQuizDay === dayOf() ? "Play again for more practice — or come back tomorrow." : "One from each game · +20 bonus XP"}</p>
        <span className="mt-4 inline-flex min-h-[44px] items-center rounded-2xl border-b-4 border-black/20 bg-white px-5 font-display font-bold text-ink transition-transform group-active:translate-y-[2px]">{p.dailyQuizDay === dayOf() ? "Play again" : "Start"}</span>
      </Link>

      <section data-panel aria-labelledby="ch-title" className="rounded-4xl bg-white p-5 ring-1 ring-ink/5">
        <h2 id="ch-title" className="flex items-center gap-2 font-display text-xl font-bold"><Target className="h-5 w-5 text-coral-400" />Today&apos;s challenges</h2>
        <ul className="mt-4 grid gap-3">
          {today.map((c) => {
            const v = Math.min(c.target, challengeValue(c, p)), done = p.claimed.includes(c.id);
            return (
              <li key={c.id} className="flex items-center gap-3">
                <span className={clsx("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", done ? "bg-sun-400" : "bg-paper ring-1 ring-ink/10")}>{done ? <Check className="h-6 w-6" strokeWidth={3} /> : <Star className="h-5 w-5 text-sun-600" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold leading-tight">{c.title}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-ink/[0.08]"><span className="block h-full rounded-full bg-sun-400 transition-[width] duration-700" style={{ width: `${ready ? (v / c.target) * 100 : 0}%` }} /></span>
                    <span className="text-xs font-bold text-ink-mute">{ready ? `${v}/${c.target}` : ""}</span>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-sun-600">+{c.reward}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-ink-mute">New challenges every day.</p>
      </section>

      <section data-panel aria-labelledby="goal-title" className="rounded-4xl bg-white p-5 ring-1 ring-ink/5">
        <h2 id="goal-title" className="flex items-center gap-2 font-display text-xl font-bold"><Flame className="h-5 w-5 fill-coral-400 text-coral-400" />Daily goal</h2>
        <p className="mt-1 text-sm text-ink-mute">Reach it each day to grow your streak.</p>
        <div role="radiogroup" aria-label="Daily goal" className="mt-3 grid grid-cols-3 gap-2">
          {GOALS.map((g) => (
            <button key={g.xp} type="button" role="radio" aria-checked={p.goal === g.xp} onClick={() => update({ ...p, goal: g.xp })}
              className={clsx("min-h-[60px] rounded-2xl border-2 border-b-4 px-2 text-center transition-colors", p.goal === g.xp ? "border-brand-500 bg-brand-50" : "border-ink/10 bg-white hover:bg-paper")}>
              <b className="block font-display">{g.xp} XP</b><span className="text-[11px] font-semibold text-ink-mute">{g.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section data-panel className="rounded-4xl bg-white p-5 ring-1 ring-ink/5">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold"><Heart className="h-5 w-5 fill-coral-400 text-coral-400" />Hearts</h2>
        <p className="mt-2 flex gap-1" aria-label={`${p.hearts} of ${MAX_HEARTS} hearts`}>{Array.from({ length: MAX_HEARTS }, (_, i) => <Heart key={i} className={clsx("h-7 w-7", i < p.hearts ? "fill-coral-400 text-coral-400" : "text-ink/15")} />)}</p>
        <p className="mt-2 text-sm text-ink-mute">{p.hearts >= MAX_HEARTS ? "Full! A wrong answer costs one heart." : `Next heart in ${mmss}. Practice wins hearts back.`}</p>
        {missed > 0 && <Link href="/learn/play/practice/" className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-2xl border-2 border-b-4 border-mint-600 bg-mint-100 px-4 font-display font-bold text-mint-600"><RotateCcw className="h-4 w-4" />Practise {missed} missed {missed === 1 ? "question" : "questions"}</Link>}
      </section>
    </div>
  );

  const total = league ? Object.values(league.teams).reduce((a, b) => a + b, 0) : 0;
  const top = league ? Math.max(1, ...Object.values(league.teams)) : 1;
  const LeagueBox = (
    <section data-panel aria-labelledby="league-title" className="rounded-4xl bg-white p-5 ring-1 ring-ink/5">
      <h2 id="league-title" className="flex items-center gap-2 font-display text-xl font-bold"><Trophy className="h-5 w-5 text-sun-600" />Team league</h2>
      <p className="mt-1 text-sm text-ink-mute">Every age group earns XP together this week. No names — just teams!</p>
      <ol className="mt-4 grid gap-3">
        {[...LEVELS].sort((a, b) => (league?.teams[b.id] || 0) - (league?.teams[a.id] || 0)).map((l, i) => {
          const xp = league?.teams[l.id] || 0, mine = ready && p.ageGroup === l.id;
          return (
            <li key={l.id} className={clsx("rounded-2xl p-3", mine ? "bg-brand-50 ring-2 ring-brand-500" : "bg-paper")}>
              <div className="flex items-center gap-3">
                <span className={clsx("flex h-8 w-8 items-center justify-center rounded-full font-display font-bold", i === 0 ? "bg-sun-400" : "bg-white ring-1 ring-ink/10")}>{i === 0 ? <Crown className="h-4 w-4" /> : i + 1}</span>
                <span className="flex-1"><b className="font-display">{l.label}</b>{mine && <span className="ml-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">Your team</span>}<span className="block text-xs text-ink-mute">{l.ages}</span></span>
                <b className="font-display">{xp} XP</b>
              </div>
              <span className="mt-2 block h-2 overflow-hidden rounded-full bg-white"><span className="block h-full rounded-full bg-brand-500 transition-[width] duration-1000" style={{ width: `${(xp / top) * 100}%` }} /></span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-ink-mute">{league ? `${total} XP so far in ${league.week.replace("-W", ", week ")} · resets on Monday` : ready ? `Week ${weekKey().split("-W")[1]} · loading…` : ""}</p>
    </section>
  );

  const Badges = (
    <section data-panel aria-labelledby="badges-title" className="rounded-4xl bg-white p-5 ring-1 ring-ink/5">
      <h2 id="badges-title" className="flex items-center gap-2 font-display text-xl font-bold"><Star className="h-5 w-5 fill-sun-400 text-sun-600" />Badges <span className="ml-auto text-sm font-bold text-ink-mute">{Object.keys(p.badges).length}/{BADGES.length}</span></h2>
      <ul className="mt-4 grid grid-cols-3 gap-x-2 gap-y-5">
        {BADGES.map((b) => {
          const earned = !!p.badges[b.id], pr = b.progress(p, ctx);
          return (
            <li key={b.id} className="flex flex-col items-center text-center" title={b.blurb}>
              <BadgeIcon badge={b} size={58} earned={ready && earned} />
              <b className="mt-2 font-display text-[13px] leading-tight">{b.title}</b>
              <span className="text-[11px] font-semibold text-ink-mute">{!ready ? "" : earned ? "Earned!" : `${Math.min(pr.have, pr.need)}/${pr.need}`}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );

  const SettingsBox = (
    <details data-panel className="rounded-4xl bg-white p-5 ring-1 ring-ink/5">
      <summary className="flex cursor-pointer list-none items-center gap-2 font-display text-lg font-bold"><Settings className="h-5 w-5 text-ink-mute" />Age group &amp; settings</summary>
      <div className="mt-4 grid gap-2">
        {LEVELS.map((l) => (
          <label key={l.id} className={clsx("flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 py-2 ring-2", p.ageGroup === l.id && ready ? "bg-brand-50 ring-brand-500" : "ring-ink/10 hover:bg-paper")}>
            <span><b className="block font-display">{l.label}</b><span className="text-sm text-ink-mute">{l.ages} · starts at {SECTIONS[l.start - 1].title}</span></span>
            <input type="radio" name="age" className="h-5 w-5 accent-brand-500" checked={ready && p.ageGroup === l.id} onChange={() => update({ ...p, ageGroup: l.id })} />
          </label>
        ))}
        <button type="button" onClick={() => { if (confirm("Start again from the beginning? Your XP, streak and badges on this device will be cleared.")) { resetProgress(); update({ ...emptyProgress(), day: dayOf() }); } }} className="mt-2 min-h-[44px] rounded-2xl text-sm font-bold text-coral-600 hover:bg-coral-100">Start again from the beginning</button>
        <p className="text-xs leading-relaxed text-ink-mute">Progress is saved on this device only — no sign-in, no names. Each question is asked once; ones you miss come back in Practice.</p>
      </div>
    </details>
  );

  /* ---------- journey */
  const bySection = SECTIONS.map((s) => ({ s, nodes: nodes.filter((n) => n.lesson.section === s.id) })).filter((x) => x.nodes.length);
  const Journey = (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
        <span data-cloud className="absolute left-[2%] top-[18%] h-20 w-40 rounded-full bg-white/70" />
        <span data-cloud className="absolute right-[4%] top-[42%] h-16 w-32 rounded-full bg-white/60" />
        <span data-cloud className="absolute left-[8%] top-[70%] h-24 w-48 rounded-full bg-white/50" />
      </div>
      <div className="relative mx-auto grid max-w-md gap-10">
        {bySection.map(({ s, nodes: list }) => {
          const done = list.filter((n) => n.state === "done").length;
          const locked = list.every((n) => n.state === "locked");
          return (
            <section key={s.id} aria-label={`Section ${s.id}: ${s.title}`}>
              <div data-banner className={clsx("sticky top-[150px] z-[5] flex items-center gap-4 rounded-3xl px-5 py-4 shadow-card md:top-[160px]", locked ? "bg-ink/10 text-ink-mute" : BANNER[s.tone])}>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] opacity-80">Section {s.id}</p>
                  <h2 className="font-display text-2xl font-bold leading-tight">{s.title}</h2>
                  <p className="text-sm opacity-90">{s.blurb}</p>
                </div>
                <span className="shrink-0 text-right font-display text-sm font-bold opacity-90">{ready ? `${done}/${list.length}` : ""}<span className="block text-[10px] uppercase tracking-[0.1em]">lessons</span></span>
              </div>
              <ol className="mt-10 grid gap-9">
                {list.map((n, i) => <Node key={n.lesson.id} n={n} i={i} cat={cats[n.lesson.category]} open={open === n.lesson.id} onToggle={() => setOpen(open === n.lesson.id ? null : n.lesson.id)} ready={ready} greeting={greeting} />)}
              </ol>
            </section>
          );
        })}
        <div className="flex flex-col items-center gap-3 pb-6 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-sun-400 shadow-[0_7px_0_0_#B7791F]"><Trophy className="h-10 w-10" /></span>
          <p className="font-display text-lg font-bold">The end of the journey — for now!</p>
          <p className="max-w-xs text-sm text-ink-mute">Teachers add new lessons and questions in the content manager.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div ref={root} className="pb-28 lg:pb-10">
      {ready && !p.onboarded && <Onboarding p={p} done={(next) => update({ ...next, onboarded: true })} />}

      <div className="sticky top-[76px] z-20 -mx-4 mb-6 bg-paper/90 px-4 py-2 backdrop-blur md:top-[88px]">{Stats}</div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className={clsx(tab !== "journey" && "hidden lg:block")}>
          <div className="mb-8 flex justify-center"><Mascot mood={ready ? "wave" : "idle"} say={greeting || "Hello!"} size={96} /></div>
          {Journey}
        </div>
        <aside className={clsx("grid gap-4 lg:sticky lg:top-[170px]", tab === "journey" && "hidden lg:grid")}>
          <div className={clsx(tab !== "today" && "hidden lg:block")}>{Today}</div>
          <div className={clsx(tab !== "league" && "hidden lg:block")}>{LeagueBox}</div>
          <div className={clsx(tab !== "badges" && "hidden lg:block")}>{Badges}</div>
          <div className={clsx(tab !== "today" && "hidden lg:block")}>{SettingsBox}</div>
        </aside>
      </div>

      {/* phone & tablet tab bar */}
      <nav aria-label="Games sections" className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden">
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {([["journey", "Journey", MapPinned], ["today", "Today", Target], ["badges", "Badges", Star], ["league", "League", Trophy]] as const).map(([id, label, Icon]) => (
            <li key={id}>
              <button type="button" aria-current={tab === id ? "page" : undefined} onClick={() => { setTab(id); window.scrollTo({ top: 0, behavior: isReduced() ? "auto" : "smooth" }); }}
                className={clsx("flex min-h-[56px] w-full flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-bold transition-colors", tab === id ? "bg-brand-50 text-brand-600" : "text-ink-mute")}>
                <Icon className="h-6 w-6" />{label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/* ------------------------------------------------------------ pieces */

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 rounded-2xl py-2 text-center">
      <span className="flex items-center gap-1 font-display text-xl font-extrabold">{icon}{value}</span>
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-ink-mute">{label}</span>
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 15, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90" aria-hidden>
      <circle cx="18" cy="18" r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-ink/10" />
      <circle cx="18" cy="18" r={r} fill="none" stroke="#FF7A59" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .9s cubic-bezier(.2,.8,.2,1)" }} />
    </svg>
  );
}

function Node({ n, i, cat, open, onToggle, ready, greeting }: { n: JourneyNode; i: number; cat?: LearnCategory; open: boolean; onToggle: () => void; ready: boolean; greeting: string }) {
  const checkpoint = n.lesson.category === "mixed";
  const Icon = checkpoint ? Trophy : cat ? ICONS[cat.icon] : BookOpen;
  const tone = checkpoint ? "sun" : cat?.tone ?? "blue";
  const locked = n.state === "locked";
  const offset = ZIG[i % ZIG.length];
  const pct = n.total ? n.seen / n.total : 0;
  const mastered = n.total > 0 && n.seen === n.total && n.review === 0;
  return (
    <li style={{ transform: `translateX(clamp(-28vw, ${offset}px, 28vw))` }}>
    <div data-node data-state={ready ? n.state : undefined} className="relative flex flex-col items-center">
      {n.state === "current" && ready && (
        <div className="absolute -top-12 z-[2] hidden whitespace-nowrap rounded-2xl border-2 border-ink/10 bg-white px-3 py-1.5 font-display text-sm font-bold shadow-card after:absolute after:left-1/2 after:top-full after:-ml-2 after:border-8 after:border-transparent after:border-t-white sm:block">Start here</div>
      )}
      <button type="button" onClick={onToggle} aria-expanded={open} disabled={!ready}
        aria-label={`${n.lesson.title}${checkpoint ? " checkpoint" : ""}: ${locked ? "locked" : n.state === "done" ? "finished" : "ready"}${ready ? `, ${n.seen} of ${n.total} questions answered` : ""}`}
        className="group relative flex h-[84px] w-[84px] items-center justify-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-sun-400">
        {n.state === "current" && <span data-current-ring aria-hidden className="absolute inset-0 rounded-full border-4" style={{ borderColor: RING[tone] }} />}
        {ready && !locked && (
          <svg viewBox="0 0 100 100" className="absolute -inset-2.5 h-[104px] w-[104px] -rotate-90" aria-hidden>
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="5" className="text-ink/[0.07]" />
            <circle cx="50" cy="50" r="46" fill="none" stroke={RING[tone]} strokeWidth="5" strokeLinecap="round" strokeDasharray={289} strokeDashoffset={289 * (1 - pct)} />
          </svg>
        )}
        <span className={clsx("relative flex h-full w-full items-center justify-center rounded-full transition-transform duration-150 group-hover:-translate-y-1 group-active:translate-y-1 group-active:shadow-none",
          locked ? "bg-ink/10 text-ink/35 shadow-[0_7px_0_0_rgba(11,21,48,.12)]" : FILL[tone], checkpoint && !locked && "ring-4 ring-white")}>
          {locked ? <Lock className="h-8 w-8" /> : <Icon className="h-9 w-9" strokeWidth={2.3} />}
          {n.state === "done" && <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-card ring-2 ring-sun-400">{mastered ? <Crown className="h-4 w-4 text-sun-600" /> : <Check className="h-4 w-4 text-mint-600" strokeWidth={3} />}</span>}
        </span>
      </button>
      <p className={clsx("mt-3 max-w-[150px] text-center font-display text-[15px] font-bold leading-tight", locked && "text-ink-mute")}>{n.lesson.title}</p>
      {n.state === "current" && ready && <div className="absolute left-[calc(50%+64px)] top-0 hidden md:block"><Mascot mood="wave" size={70} bubble="none" /></div>}

      {open && (
        <div data-pop={n.lesson.id} className={clsx("absolute top-[118px] z-[6] w-[min(300px,86vw)] rounded-3xl p-5 text-left shadow-lift", locked ? "bg-white ring-1 ring-ink/10" : BANNER[tone])}>
          <p className="text-xs font-extrabold uppercase tracking-[0.1em] opacity-80">{checkpoint ? "Checkpoint · all games" : cat?.title}</p>
          <p className="font-display text-xl font-bold">{n.lesson.title}</p>
          <p className="mt-1 text-sm opacity-90">{locked ? "Finish the lessons before this one to unlock it." : mastered ? "Mastered! Every question answered." : `${n.seen} of ${n.total} questions answered${n.review ? ` · ${n.review} to practise` : ""}`}</p>
          {!locked && (
            <Link href={`/learn/play/${n.lesson.id}/`} className="mt-4 flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border-b-4 border-black/20 bg-white font-display font-bold text-ink">
              {n.seen < n.total ? <>Start · +{n.lesson.size * 10} XP</> : n.review ? "Practise" : "Review"}
            </Link>
          )}
        </div>
      )}
      <span className="sr-only">{greeting}</span>
    </div>
    </li>
  );
}

function Onboarding({ p, done }: { p: Progress; done: (p: Progress) => void }) {
  const [step, setStep] = useState(0);
  const [age, setAge] = useState(p.ageGroup);
  const [goal, setGoal] = useState(p.goal);
  const box = useRef<HTMLDivElement>(null);
  useGSAP(() => { if (box.current && !isReduced()) gsap.fromTo(box.current, { autoAlpha: 0, y: 30, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.6)" }); }, { dependencies: [step] });
  const lines = ["Hi! I'm Pip the lamb. Let's learn about God's Word together!", "How old are you? I'll start you in the right place.", "How much do you want to learn each day?"];
  return (
    <div role="dialog" aria-modal="true" aria-label="Welcome to Bible games" className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-ink/50 p-4">
      <div ref={box} className="w-full max-w-md rounded-[2rem] bg-paper p-6 text-center shadow-lift">
        <Mascot mood={step === 0 ? "wave" : "happy"} beat={step} size={130} bubble="top" say={lines[step]} className="mx-auto" />
        {step === 1 && (
          <div className="mt-5 grid gap-2">
            {LEVELS.map((l) => <button key={l.id} type="button" onClick={() => setAge(l.id)} className={clsx("min-h-[60px] rounded-2xl border-2 border-b-4 px-4 text-left", age === l.id ? "border-brand-500 bg-brand-50" : "border-ink/10 bg-white")}><b className="font-display">{l.label}</b><span className="ml-2 text-ink-mute">{l.ages}</span></button>)}
          </div>
        )}
        {step === 2 && (
          <div className="mt-5 grid gap-2">
            {GOALS.map((g) => <button key={g.xp} type="button" onClick={() => setGoal(g.xp)} className={clsx("min-h-[60px] rounded-2xl border-2 border-b-4 px-4 text-left", goal === g.xp ? "border-brand-500 bg-brand-50" : "border-ink/10 bg-white")}><b className="font-display">{g.label}</b><span className="ml-2 text-ink-mute">{g.xp} XP a day</span></button>)}
          </div>
        )}
        <button type="button" onClick={() => (step < 2 ? setStep(step + 1) : done({ ...p, ageGroup: age, goal }))} className="btn btn-primary mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border-b-[5px] border-brand-700 bg-brand-500 font-display text-lg font-bold text-white">
          <span className="btn-label">{step === 0 ? "Hi Pip!" : step === 1 ? "Next" : "Let's go!"}</span>
        </button>
        {step === 0 && <button type="button" onClick={() => done(p)} className="mt-3 min-h-[44px] text-sm font-bold text-ink-mute">Skip</button>}
      </div>
    </div>
  );
}
