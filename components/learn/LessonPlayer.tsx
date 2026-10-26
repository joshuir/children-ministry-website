"use client";

import { isReduced } from "@/lib/motion-pref";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, Check, Flame, RotateCcw, Star, X } from "lucide-react";
import { gsap, useGSAP, Flip } from "@/lib/gsap";
import { celebrate } from "@/components/Motion";
import { TRACKS } from "@/content/learn";
import { check, choicesFor, finishLesson, loadProgress, pickSession, record, saveProgress, type Progress, type SessionMode, type Verdict } from "@/lib/learn";
import type { QuizQuestion, QuizTrack } from "@/lib/types";

const PRAISE = ["Well done!", "Brilliant!", "Amazing!", "You got it!", "Super!", "Excellent!"];
const XP_RIGHT = 10;

type Stage = "loading" | "play" | "end" | "empty";

const reduced = () => typeof window !== "undefined" && isReduced();

/* ------------------------------------------------------------ answer inputs */

function ChoiceInput({ q, value, setValue, locked, verdict }: { q: QuizQuestion; value: string; setValue: (v: string) => void; locked: boolean; verdict: Verdict | null }) {
  const opts = useMemo(() => choicesFor(q), [q]);
  return (
    <div role="radiogroup" aria-label="Answers" className={clsx("grid gap-3", opts.length > 2 ? "sm:grid-cols-2" : "grid-cols-2")}>
      {opts.map((o, i) => {
        const chosen = value === o;
        const right = verdict && o.toLowerCase() === verdict.expected.toLowerCase();
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={chosen}
            disabled={locked}
            onClick={() => setValue(o)}
            data-opt
            className={clsx(
              "flex min-h-[64px] items-center gap-3 rounded-3xl border-2 border-b-[5px] px-4 py-3 text-left font-display text-lg font-semibold transition-[background-color,border-color,transform] duration-100 active:translate-y-[2px] active:border-b-2",
              locked && right ? "border-mint-600 bg-mint-100" : locked && chosen ? "border-coral-400 bg-coral-100" : chosen ? "border-brand-500 bg-brand-50 text-brand-700" : "border-ink/10 bg-white hover:bg-paper",
            )}
          >
            <kbd className={clsx("hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-sm font-bold sm:flex", chosen ? "border-brand-500 text-brand-600" : "border-ink/15 text-ink-mute")}>{i + 1}</kbd>
            <span>{o}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Tap words to build the verse; tap a placed word to send it back. Words glide between rows (Flip). */
function OrderInput({ q, setValue, locked }: { q: QuizQuestion; setValue: (v: string) => void; locked: boolean }) {
  const words = useMemo(() => choicesFor(q).map((w, i) => ({ w, i })), [q]);
  const [picked, setPicked] = useState<number[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const state = useRef<Flip.FlipState | null>(null);

  useEffect(() => { setValue(picked.map((i) => words.find((x) => x.i === i)!.w).join(" ")); }, [picked, words, setValue]);
  useGSAP(() => {
    if (!state.current || reduced()) return;
    Flip.from(state.current, { duration: 0.35, ease: "power3.out", absolute: true });
    state.current = null;
  }, { scope: box, dependencies: [picked] });

  const toggle = (i: number) => {
    if (locked) return;
    if (box.current && !reduced()) state.current = Flip.getState(box.current.querySelectorAll("[data-word]"));
    setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  };
  const chip = "inline-flex min-h-[48px] items-center rounded-2xl border-2 border-b-[4px] border-ink/10 bg-white px-4 font-display text-lg font-semibold transition-colors duration-100 hover:bg-paper";
  return (
    <div ref={box} className="grid gap-6">
      <div aria-label="Your verse" className="flex min-h-[124px] flex-wrap content-start gap-2 border-b-2 border-t-2 border-ink/10 py-3">
        {picked.map((i) => <button key={i} type="button" data-word data-flip-id={`w${i}`} onClick={() => toggle(i)} className={chip}>{words.find((x) => x.i === i)!.w}</button>)}
      </div>
      <div aria-label="Word bank" className="flex flex-wrap justify-center gap-2">
        {words.map(({ w, i }) => picked.includes(i)
          ? <span key={i} aria-hidden className={clsx(chip, "border-transparent bg-ink/[0.06] text-transparent")}>{w}</span>
          : <button key={i} type="button" data-word data-flip-id={`w${i}`} onClick={() => toggle(i)} className={chip}>{w}</button>)}
      </div>
    </div>
  );
}

function WriteInput({ q, value, setValue, locked, onEnter }: { q: QuizQuestion; value: string; setValue: (v: string) => void; locked: boolean; onEnter: () => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, [q.id]);
  const open = q.kind === "reflect";
  return (
    <label className="grid gap-2">
      <span className="sr-only">Your answer</span>
      <textarea
        ref={ref}
        value={value}
        disabled={locked}
        onChange={(e) => setValue(e.target.value.slice(0, 400))}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !open) { e.preventDefault(); onEnter(); } }}
        rows={open ? 4 : 2}
        autoComplete="off"
        autoCapitalize="sentences"
        spellCheck={open}
        placeholder={open ? "Write here…" : "Type your answer"}
        className="w-full resize-none rounded-3xl border-2 border-ink/10 bg-white px-5 py-4 font-display text-xl font-semibold outline-none transition-colors focus:border-brand-500 disabled:opacity-70"
      />
      {open && <span className="px-2 text-sm text-ink-mute">Nothing you write is saved or shared.</span>}
    </label>
  );
}

/* ------------------------------------------------------------ the player */

export function LessonPlayer({ bank, track }: { bank: QuizQuestion[]; track: QuizTrack }) {
  const meta = TRACKS.find((t) => t.id === track)!;
  const [stage, setStage] = useState<Stage>("loading");
  const [mode, setMode] = useState<SessionMode>("new");
  const [list, setList] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [right, setRight] = useState(0);
  const [combo, setCombo] = useState(0);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [earned, setEarned] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const start = useCallback(() => {
    const p = loadProgress();
    const s = pickSession(bank, p, track);
    setProgress(p); setMode(s.mode); setList(s.questions);
    setIndex(0); setValue(""); setVerdict(null); setRight(0); setCombo(0); setEarned(0);
    setStage(s.questions.length ? "play" : "empty");
  }, [bank, track]);

  useEffect(() => { start(); }, [start]);

  const q = list[index];
  const total = list.length;

  // question entrance
  useGSAP(() => {
    if (stage !== "play" || !card.current || reduced()) return;
    gsap.fromTo(card.current, { autoAlpha: 0, x: 40 }, { autoAlpha: 1, x: 0, duration: 0.45, ease: "power3.out" });
    gsap.fromTo(card.current.querySelectorAll("[data-opt], [data-word]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out", stagger: 0.04, delay: 0.1 });
  }, { scope: root, dependencies: [stage, index] });

  // progress bar
  useGSAP(() => {
    if (!bar.current) return;
    const pct = total ? ((index + (verdict ? 1 : 0)) / total) * 100 : 0;
    gsap.to(bar.current, { width: `${pct}%`, duration: reduced() ? 0 : 0.5, ease: "power3.out" });
  }, { dependencies: [index, verdict, total] });

  // feedback sheet + answer reaction
  useGSAP(() => {
    if (!verdict || !sheet.current) return;
    if (!reduced()) {
      gsap.fromTo(sheet.current, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: "power3.out" });
      if (verdict.ok) gsap.fromTo(card.current, { scale: 1 }, { keyframes: { scale: [1.03, 1] }, duration: 0.4, ease: "power2.out" });
      else gsap.fromTo(card.current, { x: 0 }, { keyframes: { x: [-10, 10, -6, 6, 0] }, duration: 0.4, ease: "power1.out" });
    }
    sheet.current.querySelector<HTMLButtonElement>("[data-continue]")?.focus({ preventScroll: true });
  }, { dependencies: [verdict] });

  useGSAP(() => {
    if (stage !== "end" || !endRef.current) return;
    if (!reduced()) gsap.fromTo(endRef.current.querySelectorAll("[data-end]"), { autoAlpha: 0, y: 20, scale: 0.95 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)", stagger: 0.1 });
    celebrate(endRef.current.querySelector("[data-end]"));
  }, { dependencies: [stage] });

  const submit = useCallback(() => {
    if (!q || verdict || !value.trim()) return;
    const v = check(q, value);
    setVerdict(v);
    if (v.ok) { setRight((n) => n + 1); setCombo((c) => c + 1); } else setCombo(0);
    // record straight away, so leaving mid-lesson never repeats an answered question
    const p = record(loadProgress(), q.id, v.ok || q.kind === "reflect");
    saveProgress(p);
    setProgress(p);
  }, [q, verdict, value]);

  const next = useCallback(() => {
    if (index + 1 < total) { setIndex((i) => i + 1); setValue(""); setVerdict(null); return; }
    const xp = right * XP_RIGHT + (right === total ? 20 : 0);
    const p = finishLesson(loadProgress(), xp);
    saveProgress(p);
    setProgress(p); setEarned(xp); setStage("end");
  }, [index, total, right]);

  // keyboard: 1–4 pick, Enter checks / continues
  useEffect(() => {
    if (stage !== "play") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "TEXTAREA" || t.tagName === "INPUT") return;
      if (e.key === "Enter") { e.preventDefault(); if (verdict) next(); else submit(); return; }
      if (!verdict && q && /^[1-4]$/.test(e.key) && (q.kind === "choice" || q.kind === "fill" || q.kind === "truefalse")) {
        const opt = card.current?.querySelectorAll<HTMLButtonElement>("[data-opt]")[Number(e.key) - 1];
        opt?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, verdict, q, next, submit]);

  if (stage === "loading") return <div className="min-h-[60vh]" aria-busy="true" />;

  if (stage === "empty") {
    return (
      <div className="mx-auto grid max-w-lg place-items-center gap-5 py-16 text-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-full bg-sun-400"><Star className="h-12 w-12 fill-white text-white" /></span>
        <h1 className="font-display text-3xl font-bold">You&apos;ve answered every question in {meta.title}!</h1>
        <p className="text-lg text-ink-soft">Amazing work. Your teachers add new questions often — check back soon, or try another game.</p>
        <Link href="/learn/" className="btn btn-primary inline-flex min-h-[52px] items-center gap-2 rounded-full bg-brand-500 px-6 font-display font-semibold text-white"><span className="btn-label">Back to the games</span><ArrowRight className="h-5 w-5" /></Link>
      </div>
    );
  }

  if (stage === "end") {
    const pct = total ? Math.round((right / total) * 100) : 0;
    return (
      <div ref={endRef} className="mx-auto grid max-w-lg gap-6 py-10 text-center">
        <div data-end className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-sun-400 shadow-[0_8px_0_0_#E9A100]"><Star className="h-14 w-14 fill-white text-white" /></div>
        <h1 data-end className="font-display text-4xl font-bold">{pct >= 80 ? "Lesson complete!" : pct >= 50 ? "Great effort!" : "Keep practising!"}</h1>
        <div data-end className="grid grid-cols-3 gap-3">
          <div className="rounded-3xl bg-sun-100 p-4"><b className="block font-display text-3xl">+{earned}</b><span className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">XP</span></div>
          <div className="rounded-3xl bg-mint-100 p-4"><b className="block font-display text-3xl">{pct}%</b><span className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">Correct</span></div>
          <div className="rounded-3xl bg-coral-100 p-4"><b className="flex items-center justify-center gap-1 font-display text-3xl"><Flame className="h-6 w-6 fill-coral-400 text-coral-400" />{progress?.streak ?? 1}</b><span className="text-xs font-bold uppercase tracking-[0.08em] text-ink-soft">Day streak</span></div>
        </div>
        <div data-end className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button type="button" onClick={start} className="btn btn-primary inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-brand-500 px-6 font-display font-semibold text-white"><span className="btn-label">Keep going</span><ArrowRight className="h-5 w-5" /></button>
          <Link href="/learn/" className="btn inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-white px-6 font-display font-semibold ring-1 ring-ink/10">All games</Link>
        </div>
      </div>
    );
  }

  const isChoice = q.kind === "choice" || q.kind === "fill" || q.kind === "truefalse";
  const praise = PRAISE[(index + right) % PRAISE.length];
  const [before, after] = q.kind === "fill" ? q.prompt.split("___") : [q.prompt, ""];

  return (
    <div ref={root} className="mx-auto flex min-h-[calc(100dvh-7rem)] max-w-2xl flex-col">
      {/* top bar */}
      <div className="flex items-center gap-3 py-4">
        <Link href="/learn/" aria-label="Leave the lesson" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-mute transition-colors hover:bg-ink/5 hover:text-ink"><X className="h-6 w-6" /></Link>
        <div className="h-4 flex-1 overflow-hidden rounded-full bg-ink/[0.08]" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + (verdict ? 1 : 0)} aria-label="Lesson progress">
          <div ref={bar} className="h-full w-0 rounded-full bg-mint-400 shadow-[inset_0_-4px_0_rgba(0,0,0,.08)]" />
        </div>
        <span className={clsx("flex min-w-[56px] items-center justify-end gap-1 font-display text-lg font-bold transition-opacity", combo >= 2 ? "text-coral-600 opacity-100" : "opacity-0")} aria-hidden={combo < 2}>
          <Flame className="h-5 w-5 fill-coral-400 text-coral-400" />{combo}
        </span>
      </div>

      {mode === "review" && <p className="mb-2 self-start rounded-full bg-sun-100 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.08em] text-ink">Practice · questions you missed</p>}

      {/* question */}
      <div ref={card} key={q.id} className="flex flex-1 flex-col gap-6 pb-40">
        <div>
          <p className="text-sm font-extrabold uppercase tracking-[0.1em] text-brand-600">{meta.title}{q.kind === "order" ? " · Build the verse" : q.kind === "fill" ? " · Fill the gap" : q.kind === "truefalse" ? " · True or false?" : q.kind === "reflect" ? " · Your turn to write" : ""}</p>
          <h1 className="mt-2 font-display text-[clamp(1.6rem,4.6vw,2.25rem)] font-bold leading-tight" aria-live="polite">
            {q.kind === "fill" ? <>{before}<span className={clsx("mx-1 inline-block min-w-[3.5em] border-b-4 px-1 text-center", verdict ? (verdict.ok ? "border-mint-600 text-mint-600" : "border-coral-400 text-coral-600") : "border-brand-500 text-brand-600")}>{value || " "}</span>{after}</> : q.prompt}
          </h1>
          {q.reference && <p className="mt-2 font-semibold text-ink-mute">{q.reference}</p>}
        </div>

        {isChoice && <ChoiceInput q={q} value={value} setValue={setValue} locked={!!verdict} verdict={verdict} />}
        {q.kind === "order" && <OrderInput key={q.id} q={q} setValue={setValue} locked={!!verdict} />}
        {(q.kind === "write" || q.kind === "reflect") && <WriteInput q={q} value={value} setValue={setValue} locked={!!verdict} onEnter={submit} />}
      </div>

      {/* bottom: check button, or the feedback sheet */}
      <div className="fixed inset-x-0 bottom-0 z-30">
        {verdict ? (
          <div ref={sheet} role="status" className={clsx("border-t-2 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5", verdict.ok ? "border-mint-400 bg-mint-100" : "border-coral-400 bg-coral-100")}>
            <div className="mx-auto flex max-w-2xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className={clsx("flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white", verdict.ok ? "bg-mint-600" : "bg-coral-400")}>{verdict.ok ? <Check className="h-7 w-7" strokeWidth={3} /> : <RotateCcw className="h-6 w-6" strokeWidth={3} />}</span>
                <div>
                  <p className={clsx("font-display text-2xl font-bold", verdict.ok ? "text-mint-600" : "text-coral-600")}>
                    {q.kind === "reflect" ? (verdict.ok ? "Thank you!" : "Write a little more next time") : verdict.ok ? (verdict.close ? "Nearly perfect!" : praise) : "Not quite"}
                  </p>
                  {!verdict.ok && q.kind !== "reflect" && <p className="font-semibold text-ink">Answer: {verdict.expected}</p>}
                  {verdict.close && <p className="font-semibold text-ink">Check the spelling: {verdict.expected}</p>}
                  {q.explain && <p className="mt-1 text-ink-soft">{q.explain}</p>}
                </div>
              </div>
              <button type="button" data-continue onClick={next} className={clsx("btn inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-b-[5px] px-8 font-display text-lg font-bold text-white", verdict.ok ? "border-[#0E4E9C] bg-mint-600" : "border-[#C9512F] bg-coral-400")}>
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
    </div>
  );
}
