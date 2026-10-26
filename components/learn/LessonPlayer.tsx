"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Check, Flame, Heart, RotateCcw, Target, X, Zap } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { isReduced } from "@/lib/motion-pref";
import { celebrate } from "@/components/Motion";
import { Mascot, type Mood } from "./Mascot";
import { BadgeIcon } from "./BadgeIcon";
import { INPUTS, KIND_LABEL } from "./inputs";
import {
  HEART_MS, MAX_HEARTS, answer, check, finish, journey, loadProgress, pickDaily, pickLesson, pickPractice, refresh, saveProgress,
  type FinishResult, type Progress, type SessionMode, type Verdict,
} from "@/lib/learn";
import type { LearnCategory, LearnChallenge, LearnLesson, QuizQuestion } from "@/lib/types";

const RIGHT_LINES = ["Well done!", "Brilliant!", "You got it!", "Amazing!", "Super!", "That's right!", "Excellent!"];
const WRONG_LINES = ["Nearly! Let's learn it.", "Good try — now you know!", "Not quite. You'll get the next one!"];
const COMBO_LINES = ["You're on fire!", "Unstoppable!", "Wow, what a streak!"];

type Stage = "loading" | "play" | "end" | "empty" | "mastered" | "hearts";

export function LessonPlayer({ id, bank, lessons, categories, challenges }: {
  id: string; bank: QuizQuestion[]; lessons: LearnLesson[]; categories: LearnCategory[]; challenges: LearnChallenge[];
}) {
  const lesson = lessons.find((l) => l.id === id);
  const isDaily = id === "daily", isPractice = id === "practice";
  const title = isDaily ? "Daily quiz" : isPractice ? "Practice" : lesson?.title ?? "Lesson";
  const catTitle = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.title])), [categories]);

  const [stage, setStage] = useState<Stage>("loading");
  const [mode, setMode] = useState<SessionMode>("new");
  const [list, setList] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [right, setRight] = useState(0);
  const [combo, setCombo] = useState(0);
  const [p, setP] = useState<Progress | null>(null);
  const [result, setResult] = useState<FinishResult | null>(null);
  const [mood, setMood] = useState<Mood>("wave");
  const [line, setLine] = useState("");
  const [beat, setBeat] = useState(0);
  const [, tick] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const hearts = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const practice = isPractice || mode === "practice";

  const start = useCallback(() => {
    const prog = refresh(loadProgress());
    saveProgress(prog);
    setP(prog);
    setIndex(0); setValue(""); setVerdict(null); setRight(0); setCombo(0); setResult(null);
    let qs: QuizQuestion[] = [], m: SessionMode = "new";
    if (isPractice) { qs = pickPractice(bank, prog); m = "practice"; }
    else if (isDaily) { qs = pickDaily(bank, prog); }
    else if (lesson) { const s = pickLesson(bank, lesson, prog); qs = s.questions; m = s.mode; }
    setMode(m); setList(qs);
    if (m === "mastered") { setStage("mastered"); setMood("cheer"); setLine("You've mastered this lesson!"); return; }
    if (!qs.length) { setStage("empty"); setMood(isPractice ? "happy" : "think"); setLine(isPractice ? "Nothing to practise — you haven't missed anything!" : "No questions here yet."); return; }
    if (m !== "practice" && prog.hearts === 0) { setStage("hearts"); setMood("sad"); setLine("Out of hearts! Practise to win some back."); return; }
    setStage("play"); setMood("wave"); setLine(m === "practice" ? "Let's practise the tricky ones!" : isDaily ? "Here's today's quiz!" : "Let's go!"); setBeat((b) => b + 1);
  }, [bank, isDaily, isPractice, lesson]);

  useEffect(() => { start(); }, [start]);
  // keep the heart refill countdown ticking
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(t); }, []);

  const q = list[index];
  const total = list.length;

  /* ---------- animations */
  useGSAP(() => {
    if (stage !== "play" || !card.current || isReduced()) return;
    gsap.fromTo(card.current, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: "power3.out" });
    gsap.fromTo(card.current.querySelectorAll("[data-opt], [data-word], [data-box]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.035, delay: 0.1 });
  }, { scope: root, dependencies: [stage, index] });

  useGSAP(() => {
    if (!bar.current) return;
    gsap.to(bar.current, { width: `${total ? ((index + (verdict ? 1 : 0)) / total) * 100 : 0}%`, duration: isReduced() ? 0 : 0.5, ease: "power3.out" });
  }, { dependencies: [index, verdict, total] });

  useGSAP(() => {
    if (!verdict || !sheet.current) return;
    if (!isReduced()) {
      gsap.fromTo(sheet.current, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: "power3.out" });
      if (verdict.ok) gsap.fromTo(card.current, { scale: 1 }, { keyframes: { scale: [1.025, 1] }, duration: 0.4, ease: "power2.out" });
      else gsap.fromTo(card.current, { x: 0 }, { keyframes: { x: [-10, 10, -6, 6, 0] }, duration: 0.4, ease: "power1.out" });
      if (!verdict.ok && !practice) {
        const h = hearts.current?.querySelector("[data-heart-lost]");
        if (h) gsap.fromTo(h, { scale: 1.6, rotation: -15 }, { scale: 1, rotation: 0, duration: 0.5, ease: "elastic.out(1, 0.4)" });
      }
      if (verdict.ok && combo >= 3) {
        const f = root.current?.querySelector("[data-combo]");
        if (f) gsap.fromTo(f, { scale: 1.5 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
      }
    }
    sheet.current.querySelector<HTMLButtonElement>("[data-continue]")?.focus({ preventScroll: true });
  }, { dependencies: [verdict] });

  useGSAP(() => {
    if (stage !== "end" || !endRef.current) return;
    if (!isReduced()) gsap.fromTo(endRef.current.querySelectorAll("[data-end]"), { autoAlpha: 0, y: 24, scale: 0.92 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.6)", stagger: 0.18 });
    const counter = endRef.current.querySelector<HTMLElement>("[data-xp-count]");
    const target = (result?.xp || 0) + (result?.bonus || 0);
    if (counter) { const o = { v: 0 }; gsap.to(o, { v: target, duration: isReduced() ? 0 : 1.2, ease: "power2.out", delay: 0.3, onUpdate: () => { counter.textContent = `+${Math.round(o.v)}`; } }); }
    celebrate(endRef.current.querySelector("[data-end]"));
  }, { dependencies: [stage] });

  /* ---------- answering */
  const submit = useCallback(() => {
    if (!q || verdict || !value.trim() || !p) return;
    const v = check(q, value);
    setVerdict(v);
    const counted = v.ok || q.kind === "reflect";
    const nextCombo = counted ? combo + 1 : 0;
    if (counted) { setRight((n) => n + 1); setCombo(nextCombo); } else setCombo(0);
    const prog = answer(p, q, v.ok, practice);
    saveProgress(prog);
    setP(prog);
    setMood(counted ? (nextCombo >= 3 ? "cheer" : "happy") : "sad");
    setLine(counted ? (nextCombo >= 3 ? COMBO_LINES[nextCombo % COMBO_LINES.length] : RIGHT_LINES[(index + nextCombo) % RIGHT_LINES.length]) : WRONG_LINES[index % WRONG_LINES.length]);
    setBeat((b) => b + 1);
  }, [q, verdict, value, p, combo, practice, index]);

  const next = useCallback(() => {
    if (!p) return;
    if (!practice && p.hearts === 0 && index + 1 < total) { setStage("hearts"); setMood("sad"); setLine("Out of hearts! Practise to win some back."); return; }
    if (index + 1 < total) { setIndex((i) => i + 1); setValue(""); setVerdict(null); setMood("think"); setLine(""); return; }
    const r = finish(p, { lessonId: lesson && !isPractice ? lesson.id : undefined, right, total, daily: isDaily, practice }, { challenges, bank, lessons, categories });
    saveProgress(r.p);
    setP(r.p); setResult(r); setStage("end");
    setMood("cheer"); setLine(right === total ? "Perfect! Not one mistake!" : right >= total * 0.7 ? "Great job! You're growing!" : "Well done for finishing!"); setBeat((b) => b + 1);
    // the team league: this age group's XP for the week (anonymous — no names)
    fetch("/api/learn/league", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ team: r.p.ageGroup, xp: r.xp + r.bonus }) }).catch(() => {});
  }, [p, practice, index, total, lesson, isPractice, right, isDaily, challenges, bank, lessons, categories]);

  useEffect(() => {
    if (stage !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "TEXTAREA" || t.tagName === "INPUT") return;
      if (e.key === "Enter") { e.preventDefault(); if (verdict) next(); else submit(); return; }
      if (!verdict && q && /^[1-4]$/.test(e.key) && (q.kind === "choice" || q.kind === "fill" || q.kind === "truefalse")) card.current?.querySelectorAll<HTMLButtonElement>("[data-opt]")[Number(e.key) - 1]?.click();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, verdict, q, next, submit]);

  /* ---------- screens */
  const nextLesson = useMemo(() => (p ? journey(bank, lessons, p).find((n) => n.state === "current")?.lesson : undefined), [p, bank, lessons]);
  const heartWait = p && p.hearts < MAX_HEARTS ? Math.max(0, p.heartAt + HEART_MS - Date.now()) : 0;
  const mmss = `${Math.floor(heartWait / 60000)}:${String(Math.floor((heartWait % 60000) / 1000)).padStart(2, "0")}`;

  if (stage === "loading") return <div className="min-h-[60vh]" aria-busy="true" />;

  if (stage === "empty" || stage === "mastered" || stage === "hearts") {
    const missed = p ? Object.keys(p.missed).length : 0;
    return (
      <div className="mx-auto grid min-h-[80dvh] max-w-lg place-items-center py-10 text-center">
        <div className="grid justify-items-center gap-5">
          <Mascot mood={mood} beat={beat} size={150} />
          <h1 className="font-display text-3xl font-bold">{stage === "hearts" ? "Out of hearts" : stage === "mastered" ? `You've mastered ${title}!` : isPractice ? "All caught up!" : "Nothing here yet"}</h1>
          <p className="text-lg text-ink-soft">
            {stage === "hearts" ? <>Hearts refill over time{heartWait ? <> — next one in <b>{mmss}</b></> : null}. Practising questions you missed wins hearts back right now.</>
              : stage === "mastered" ? "You've answered every question in this lesson. Teachers add new ones often — try the next lesson!"
              : isPractice ? "You haven't missed any questions. Keep going on your journey!" : "Your teachers will add questions here soon."}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            {stage === "hearts" && missed > 0 && <Link href="/learn/play/practice/" className="btn btn-primary inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-b-[5px] border-brand-700 bg-brand-500 px-6 font-display font-bold text-white"><span className="btn-label">Practise ({missed})</span><Heart className="h-5 w-5 fill-white" /></Link>}
            {stage === "mastered" && nextLesson && <Link href={`/learn/play/${nextLesson.id}/`} className="btn btn-primary inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-b-[5px] border-brand-700 bg-brand-500 px-6 font-display font-bold text-white"><span className="btn-label">Next lesson</span><ArrowRight className="h-5 w-5" /></Link>}
            <Link href="/learn/" className="btn inline-flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-b-[5px] border-ink/10 bg-white px-6 font-display font-bold">Back to my journey</Link>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "end" && result && p) {
    const pct = total ? Math.round((right / total) * 100) : 0;
    return (
      <div ref={endRef} className="mx-auto grid min-h-[90dvh] max-w-xl content-center gap-6 py-10 text-center">
        <div data-end className="mx-auto"><Mascot mood={mood} beat={beat} size={170} bubble="top" say={line} /></div>
        <h1 data-end className="font-display text-4xl font-extrabold">{isPractice ? "Practice done!" : isDaily ? "Daily quiz done!" : "Lesson complete!"}</h1>
        <div data-end className="grid grid-cols-3 gap-3">
          <div className="rounded-3xl border-2 border-sun-400 bg-sun-100 p-4"><Zap className="mx-auto h-6 w-6 fill-sun-400 text-sun-600" /><b data-xp-count className="block font-display text-3xl">+0</b><span className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">XP</span></div>
          <div className="rounded-3xl border-2 border-mint-400 bg-mint-100 p-4"><Target className="mx-auto h-6 w-6 text-mint-600" /><b className="block font-display text-3xl">{pct}%</b><span className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">Correct</span></div>
          <div className="rounded-3xl border-2 border-coral-400 bg-coral-100 p-4"><Flame className="mx-auto h-6 w-6 fill-coral-400 text-coral-600" /><b className="block font-display text-3xl">{p.streak}</b><span className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">Day streak</span></div>
        </div>
        {(result.goalReached || result.challenges.length > 0 || result.badges.length > 0) && (
          <ul data-end className="grid gap-2 text-left">
            {result.goalReached && <li className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink/10"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-coral-400 text-white"><Flame className="h-6 w-6 fill-white" /></span><span><b className="block font-display">Daily goal reached!</b><span className="text-sm text-ink-mute">Your streak is now {p.streak} {p.streak === 1 ? "day" : "days"}.</span></span></li>}
            {result.challenges.map((c) => <li key={c.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink/10"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-sun-400"><Check className="h-6 w-6" strokeWidth={3} /></span><span><b className="block font-display">Challenge complete: {c.title}</b><span className="text-sm text-ink-mute">+{c.reward} bonus XP</span></span></li>)}
            {result.badges.map((b) => <li key={b.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 ring-2 ring-sun-400"><BadgeIcon badge={b} size={44} earned /><span><b className="block font-display">New badge: {b.title}</b><span className="text-sm text-ink-mute">{b.blurb}</span></span></li>)}
          </ul>
        )}
        <div data-end className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          {nextLesson && !isPractice && <Link href={`/learn/play/${nextLesson.id}/`} className="btn btn-primary inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-b-[5px] border-brand-700 bg-brand-500 px-6 font-display font-bold text-white"><span className="btn-label">Next: {nextLesson.title}</span><ArrowRight className="h-5 w-5" /></Link>}
          <Link href="/learn/" className="btn inline-flex min-h-[52px] items-center justify-center rounded-2xl border-2 border-b-[5px] border-ink/10 bg-white px-6 font-display font-bold">My journey</Link>
        </div>
      </div>
    );
  }

  if (!q || !p) return null;
  const Input = INPUTS[q.kind];
  const [before, after] = q.kind === "fill" ? q.prompt.split("___") : [q.prompt, ""];
  const counted = verdict && (verdict.ok || q.kind === "reflect");

  return (
    <div ref={root} className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col">
      {/* top bar: leave, progress, hearts */}
      <div className="sticky top-0 z-10 -mx-4 flex items-center gap-3 bg-paper/95 px-4 py-4 backdrop-blur">
        <Link href="/learn/" aria-label="Leave the lesson" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-mute transition-colors hover:bg-ink/5 hover:text-ink"><X className="h-6 w-6" /></Link>
        <div className="relative h-4 flex-1 overflow-hidden rounded-full bg-ink/[0.08]" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + (verdict ? 1 : 0)} aria-label="Lesson progress">
          <div ref={bar} className="h-full w-0 rounded-full bg-mint-400 shadow-[inset_0_-4px_0_rgba(0,0,0,.08)]" />
        </div>
        {combo >= 2 && <span data-combo className="flex items-center gap-1 font-display text-lg font-bold text-coral-600" aria-label={`${combo} in a row`}><Flame className="h-5 w-5 fill-coral-400 text-coral-400" />{combo}</span>}
        <div ref={hearts} className={clsx("flex items-center gap-1 font-display text-lg font-bold", practice ? "text-mint-600" : "text-coral-600")} aria-label={practice ? "Practice — no hearts lost" : `${p.hearts} hearts`}>
          <Heart data-heart-lost className={clsx("h-6 w-6", practice ? "fill-mint-400 text-mint-400" : "fill-coral-400 text-coral-400")} />{practice ? "∞" : p.hearts}
        </div>
      </div>

      {practice && <p className="mb-2 self-start rounded-full bg-mint-100 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.08em] text-mint-600">Practice · each right answer wins a heart</p>}

      <div ref={card} key={q.id} className="flex flex-1 flex-col gap-6 pb-44">
        <div className="flex items-start gap-3">
          <Mascot mood={mood} beat={beat} size={72} bubble="none" className="-ml-2 hidden shrink-0 sm:flex" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold uppercase tracking-[0.1em] text-brand-600">{isDaily || lesson?.category === "mixed" || isPractice ? catTitle[q.track] ?? title : title}{KIND_LABEL[q.kind] ? ` · ${KIND_LABEL[q.kind]}` : ""}</p>
            <h1 className="mt-2 font-display text-[clamp(1.5rem,4.4vw,2.2rem)] font-bold leading-tight" aria-live="polite">
              {q.kind === "fill" ? <>{before}<span className={clsx("mx-1 inline-block min-w-[3.5em] rounded-xl border-2 border-b-4 px-2 text-center", verdict ? (verdict.ok ? "border-mint-600 bg-mint-100 text-mint-600" : "border-coral-400 bg-coral-100 text-coral-600") : value ? "border-brand-500 bg-brand-50 text-brand-600" : "border-dashed border-ink/25")}>{value || " "}</span>{after}</> : q.prompt}
            </h1>
            {q.scripture && <blockquote className="mt-3 rounded-2xl bg-sun-100 px-4 py-3 font-display text-lg font-semibold">“{q.scripture}”</blockquote>}
            {q.reference && <p className="mt-2 font-semibold text-ink-mute">{q.reference}</p>}
          </div>
        </div>
        <Input q={q} value={value} setValue={setValue} locked={!!verdict} verdict={verdict} onSubmit={submit} />
      </div>

      {/* bottom: check, or the feedback sheet with Pip */}
      <div className="fixed inset-x-0 bottom-0 z-30">
        {verdict ? (
          <div ref={sheet} role="status" className={clsx("border-t-2 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4", counted ? "border-mint-400 bg-mint-100" : "border-coral-400 bg-coral-100")}>
            <div className="mx-auto flex max-w-2xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Mascot mood={mood} beat={beat} size={64} bubble="none" className="shrink-0 sm:hidden" />
                <span className={clsx("hidden h-12 w-12 shrink-0 items-center justify-center rounded-full text-white sm:flex", counted ? "bg-mint-600" : "bg-coral-400")}>{counted ? <Check className="h-7 w-7" strokeWidth={3} /> : <RotateCcw className="h-6 w-6" strokeWidth={3} />}</span>
                <div>
                  <p className={clsx("font-display text-2xl font-bold", counted ? "text-mint-600" : "text-coral-600")}>{q.kind === "reflect" ? (counted ? "Thank you!" : "Write a little more next time") : verdict.close ? "Nearly perfect!" : line}</p>
                  {!counted && q.kind !== "reflect" && q.kind !== "sequence" && <p className="font-semibold text-ink">Answer: {verdict.expected}</p>}
                  {verdict.close && <p className="font-semibold text-ink">Check the spelling: {verdict.expected}</p>}
                  {q.explain && <p className="mt-1 text-ink-soft">{q.explain}</p>}
                  {!counted && !practice && <p className="mt-1 text-sm font-semibold text-coral-600">−1 heart · it&apos;ll come back in Practice</p>}
                </div>
              </div>
              <button type="button" data-continue onClick={next} className={clsx("btn inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-b-[5px] px-8 font-display text-lg font-bold text-white", counted ? "border-[#0E4E9C] bg-mint-600" : "border-[#C9512F] bg-coral-400")}>
                <span className="btn-label">{index + 1 < total ? "Continue" : "Finish"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="border-t border-ink/10 bg-paper/95 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur">
            <div className="mx-auto flex max-w-2xl justify-end">
              <button type="button" onClick={submit} disabled={!value.trim()} className="btn btn-primary inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border-b-[5px] border-brand-700 bg-brand-500 px-10 font-display text-lg font-bold text-white disabled:border-ink/10 disabled:bg-ink/10 disabled:text-ink-mute sm:w-auto">
                <span className="btn-label">Check</span>
              </button>
            </div>
          </div>
        )}
      </div>
      <span className="sr-only" aria-live="polite">{verdict ? (counted ? "Correct" : `Not quite. ${verdict.expected}`) : ""}</span>
    </div>
  );
}
