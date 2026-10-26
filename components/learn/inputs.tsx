"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { gsap, useGSAP, Flip } from "@/lib/gsap";
import { isReduced } from "@/lib/motion-pref";
import { choicesFor, simplify, type Verdict } from "@/lib/learn";
import type { QuizQuestion } from "@/lib/types";

/** Shared props for every exercise input. `setValue("")` means "not ready to check yet". */
export interface InputProps { q: QuizQuestion; value: string; setValue: (v: string) => void; locked: boolean; verdict: Verdict | null; onSubmit: () => void }

const tile = "inline-flex min-h-[52px] select-none items-center justify-center rounded-2xl border-2 border-b-[5px] px-4 font-display text-lg font-semibold transition-[background-color,border-color,transform,color] duration-100 active:translate-y-[2px] active:border-b-2 disabled:active:translate-y-0";
const idle = "border-ink/10 bg-white text-ink hover:bg-paper";

/** Smoothly moves tiles between the tray and the answer row (GSAP Flip). */
function useFlip(scope: React.RefObject<HTMLElement | null>, dep: unknown) {
  const state = useRef<Flip.FlipState | null>(null);
  useGSAP(() => {
    if (!state.current || isReduced()) return;
    Flip.from(state.current, { duration: 0.32, ease: "power3.out", absolute: true });
    state.current = null;
  }, { scope, dependencies: [dep] });
  return () => { if (scope.current && !isReduced()) state.current = Flip.getState(scope.current.querySelectorAll("[data-flip-id]")); };
}

/* ------------------------------------------------------------ multiple choice, fill the gap, true/false */

export function ChoiceInput({ q, value, setValue, locked, verdict }: InputProps) {
  const opts = useMemo(() => choicesFor(q), [q]);
  return (
    <div role="radiogroup" aria-label="Answers" className={clsx("grid gap-3", opts.length > 2 ? "sm:grid-cols-2" : "grid-cols-2")}>
      {opts.map((o, i) => {
        const chosen = value === o;
        const right = verdict && simplify(o) === simplify(verdict.expected);
        return (
          <button key={o} type="button" role="radio" aria-checked={chosen} disabled={locked} onClick={() => setValue(o)} data-opt
            className={clsx(tile, "w-full justify-start gap-3 py-3 text-left",
              locked && right ? "border-mint-600 bg-mint-100" : locked && chosen ? "border-coral-400 bg-coral-100" : chosen ? "border-brand-500 bg-brand-50 text-brand-700" : idle)}>
            <kbd className={clsx("hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-sm font-bold sm:flex", chosen ? "border-brand-500 text-brand-600" : "border-ink/15 text-ink-mute")}>{i + 1}</kbd>
            <span>{o}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------ tap pieces into order (verse words, puzzle letters) */

function PieceTray({ pieces, join, setValue, locked, letters }: { pieces: string[]; join: string; setValue: (v: string) => void; locked: boolean; letters?: boolean }) {
  const [picked, setPicked] = useState<number[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const snap = useFlip(box, picked);
  useEffect(() => { setValue(picked.length === pieces.length ? picked.map((i) => pieces[i]).join(join) : ""); }, [picked, pieces, join, setValue]);
  const toggle = (i: number) => { if (locked) return; snap(); setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i])); };
  const size = letters ? "h-14 w-12 px-0 text-2xl" : "";
  return (
    <div ref={box} className="grid gap-6">
      <div aria-label="Your answer" className={clsx("flex min-h-[124px] flex-wrap content-start gap-2 border-y-2 border-ink/10 py-3", letters && "min-h-[84px] justify-center")}>
        {picked.map((i) => <button key={i} type="button" data-word data-flip-id={`p${i}`} onClick={() => toggle(i)} className={clsx(tile, idle, size)}>{pieces[i]}</button>)}
      </div>
      <div aria-label="Pieces" className="flex flex-wrap justify-center gap-2">
        {pieces.map((w, i) => picked.includes(i)
          ? <span key={i} aria-hidden className={clsx(tile, size, "border-transparent bg-ink/[0.06] text-transparent")}>{w}</span>
          : <button key={i} type="button" data-word data-flip-id={`p${i}`} onClick={() => toggle(i)} className={clsx(tile, idle, size)}>{w}</button>)}
      </div>
    </div>
  );
}

export function OrderInput(p: InputProps) {
  const pieces = useMemo(() => choicesFor(p.q), [p.q]);
  return <PieceTray pieces={pieces} join=" " setValue={p.setValue} locked={p.locked} />;
}

export function ScrambleInput(p: InputProps) {
  const pieces = useMemo(() => choicesFor(p.q), [p.q]);
  return <PieceTray pieces={pieces} join="" setValue={p.setValue} locked={p.locked} letters />;
}

/* ------------------------------------------------------------ spelling bee: letter boxes */

export function SpellInput({ q, value, setValue, locked, verdict, onSubmit }: InputProps) {
  const len = q.answer.replace(/[^A-Za-z]/g, "").length;
  const ref = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, [q.id]);
  useEffect(() => { setValue(text.length === len ? text : ""); }, [text, len, setValue]);
  void value;
  return (
    <div className="grid justify-items-center gap-4">
      <label className="relative cursor-text" onClick={() => ref.current?.focus()}>
        <span className="sr-only">Type the word, {len} letters</span>
        <input ref={ref} value={text} disabled={locked} maxLength={len} autoComplete="off" autoCapitalize="characters" spellCheck={false} inputMode="text"
          onChange={(e) => setText(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, len))}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onSubmit(); } }}
          className="absolute inset-0 h-full w-full opacity-0" />
        <span aria-hidden className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
          {Array.from({ length: len }, (_, i) => {
            const ch = text[i] || "";
            const active = !locked && i === text.length;
            return (
              <span key={i} data-box className={clsx("flex h-14 w-11 items-center justify-center rounded-xl border-2 border-b-[4px] font-display text-2xl font-extrabold uppercase transition-colors sm:h-16 sm:w-12",
                verdict ? (verdict.ok ? "border-mint-600 bg-mint-100 text-mint-600" : "border-coral-400 bg-coral-100 text-coral-600") : ch ? "border-brand-500 bg-brand-50 text-brand-700" : active ? "border-brand-400 bg-white" : "border-ink/15 bg-white")}>
                {ch}
              </span>
            );
          })}
        </span>
      </label>
      <p className="text-sm font-semibold text-ink-mute">{len} letters · tap the boxes and type</p>
    </div>
  );
}

/* ------------------------------------------------------------ match up: tap a left item, then its partner */

const PAIR_TONES = ["bg-brand-100 border-brand-500", "bg-sun-100 border-sun-600", "bg-coral-100 border-coral-400", "bg-mint-100 border-mint-600", "bg-lilac-100 border-lilac-400"];

export function MatchInput({ q, setValue, locked, verdict }: InputProps) {
  const lefts = useMemo(() => (q.pairs || []).map((p) => p.a), [q]);
  const rights = useMemo(() => {
    const r = (q.pairs || []).map((p) => p.b);
    for (let t = 0; t < 8; t++) { const s = [...r].sort(() => Math.random() - 0.5); if (s.join() !== r.join()) return s; }
    return [...r].reverse();
  }, [q]);
  const [map, setMap] = useState<Record<string, string>>({});
  const [sel, setSelState] = useState<string | null>(null);
  // the latest selection, readable immediately even before React re-renders (fast double taps)
  const selRef = useRef<string | null>(null);
  const mapRef = useRef<Record<string, string>>({});
  const setSel = (v: string | null) => { selRef.current = v; setSelState(v); };
  const commit = (m: Record<string, string>) => { mapRef.current = m; setMap(m); };
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => { setValue(Object.keys(map).length === lefts.length ? JSON.stringify(map) : ""); }, [map, lefts.length, setValue]);
  const pairIndex = (left: string) => lefts.indexOf(left);
  const pop = (sel: string) => { if (!isReduced()) gsap.fromTo(root.current?.querySelectorAll(sel) || [], { scale: 0.94 }, { scale: 1, duration: 0.3, ease: "back.out(3)" }); };

  function pickLeft(a: string) {
    if (locked) return;
    const cur = mapRef.current;
    if (cur[a]) { const m = { ...cur }; delete m[a]; commit(m); setSel(a); return; }
    setSel(selRef.current === a ? null : a);
  }
  function pickRight(b: string) {
    if (locked) return;
    const cur = mapRef.current, chosen = selRef.current;
    const owner = Object.keys(cur).find((k) => cur[k] === b);
    if (owner && !chosen) { const m = { ...cur }; delete m[owner]; commit(m); return; }
    if (!chosen) return;
    const m = { ...cur };
    if (owner) delete m[owner];
    m[chosen] = b;
    commit(m); setSel(null);
    requestAnimationFrame(() => pop(`[data-pair="${pairIndex(chosen)}"]`));
  }
  const correct = (a: string) => (q.pairs || []).find((p) => p.a === a)?.b === map[a];

  return (
    <div ref={root} className="grid grid-cols-2 gap-3 sm:gap-4" aria-label="Match the pairs">
      <div className="grid content-start gap-3">
        {lefts.map((a) => {
          const i = pairIndex(a), paired = !!map[a];
          return (
            <button key={a} type="button" data-opt data-pair={paired ? i : undefined} aria-pressed={sel === a} onClick={() => pickLeft(a)} disabled={locked}
              className={clsx(tile, "w-full px-3 py-2 text-center text-base leading-tight sm:text-lg",
                locked ? (correct(a) ? "border-mint-600 bg-mint-100" : "border-coral-400 bg-coral-100") : sel === a ? "border-brand-500 bg-brand-50 ring-4 ring-brand-500/20" : paired ? PAIR_TONES[i % PAIR_TONES.length] : idle)}>
              {a}
            </button>
          );
        })}
      </div>
      <div className="grid content-start gap-3">
        {rights.map((b) => {
          const owner = Object.keys(map).find((k) => map[k] === b);
          const i = owner ? pairIndex(owner) : -1;
          return (
            <button key={b} type="button" data-opt data-pair={owner ? i : undefined} onClick={() => pickRight(b)} disabled={locked}
              className={clsx(tile, "w-full px-3 py-2 text-center text-base leading-tight sm:text-lg",
                locked ? (owner && correct(owner) ? "border-mint-600 bg-mint-100" : "border-coral-400 bg-coral-100") : owner ? PAIR_TONES[i % PAIR_TONES.length] : sel ? "border-brand-200 bg-white hover:bg-brand-50" : idle)}>
              {b}
            </button>
          );
        })}
      </div>
      {!locked && <p className="col-span-2 text-center text-sm font-semibold text-ink-mute">{sel ? `Now tap the partner for “${sel}”` : "Tap a word on the left, then its partner on the right"}</p>}
      {verdict && !verdict.ok && <span className="sr-only">Correct pairs: {verdict.expected}</span>}
    </div>
  );
}

/* ------------------------------------------------------------ story order: tap events in the order they happened */

export function SequenceInput({ q, setValue, locked, verdict }: InputProps) {
  const events = useMemo(() => choicesFor(q), [q]);
  const [order, setOrder] = useState<number[]>([]);
  const box = useRef<HTMLDivElement>(null);
  const snap = useFlip(box, order);
  useEffect(() => { setValue(order.length === events.length ? order.map((i) => events[i]).join("\n") : ""); }, [order, events, setValue]);
  const toggle = (i: number) => { if (locked) return; snap(); setOrder((o) => (o.includes(i) ? o.filter((x) => x !== i) : [...o, i])); };
  const right = (pos: number, i: number) => (q.items || [])[pos] === events[i];
  return (
    <div ref={box} className="grid gap-5">
      <ol aria-label="Your order" className="grid min-h-[60px] gap-2">
        {order.map((i, pos) => (
          <li key={i}>
            <button type="button" data-word data-flip-id={`e${i}`} onClick={() => toggle(i)} disabled={locked}
              className={clsx(tile, "w-full justify-start gap-3 py-2 text-left text-base sm:text-lg", locked ? (right(pos, i) ? "border-mint-600 bg-mint-100" : "border-coral-400 bg-coral-100") : "border-brand-500 bg-brand-50")}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-white">{pos + 1}</span>{events[i]}
            </button>
          </li>
        ))}
        {order.length < events.length && <li className="rounded-2xl border-2 border-dashed border-ink/15 px-4 py-3 text-center text-sm font-semibold text-ink-mute">{order.length === 0 ? "Tap what happened first" : "What happened next?"}</li>}
      </ol>
      <div aria-label="Events" className="grid gap-2 sm:grid-cols-2">
        {events.map((e, i) => order.includes(i) ? null : (
          <button key={i} type="button" data-word data-flip-id={`e${i}`} onClick={() => toggle(i)} className={clsx(tile, idle, "w-full py-2 text-base sm:text-lg")}>{e}</button>
        ))}
      </div>
      {verdict && !verdict.ok && <p className="text-sm font-semibold text-ink-soft">Right order: {verdict.expected}</p>}
    </div>
  );
}

/* ------------------------------------------------------------ typed answers & open writing */

export function WriteInput({ q, value, setValue, locked, onSubmit }: InputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { ref.current?.focus({ preventScroll: true }); }, [q.id]);
  const open = q.kind === "reflect";
  return (
    <label className="grid gap-2">
      <span className="sr-only">Your answer</span>
      <textarea ref={ref} value={value} disabled={locked} onChange={(e) => setValue(e.target.value.slice(0, 400))}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !open) { e.preventDefault(); onSubmit(); } }}
        rows={open ? 4 : 2} autoComplete="off" autoCapitalize="sentences" spellCheck={open} placeholder={open ? "Write here…" : "Type your answer"}
        className="w-full resize-none rounded-3xl border-2 border-ink/10 bg-white px-5 py-4 font-display text-xl font-semibold outline-none transition-colors focus:border-brand-500 disabled:opacity-70" />
      {open && <span className="px-2 text-sm text-ink-mute">Nothing you write is saved or shared.</span>}
    </label>
  );
}

export const INPUTS: Record<QuizQuestion["kind"], (p: InputProps) => React.ReactNode> = {
  choice: ChoiceInput, fill: ChoiceInput, truefalse: ChoiceInput, order: OrderInput, scramble: ScrambleInput,
  spell: SpellInput, match: MatchInput, sequence: SequenceInput, write: WriteInput, reflect: WriteInput,
};

export const KIND_LABEL: Record<QuizQuestion["kind"], string> = {
  choice: "", fill: "Fill the gap", truefalse: "True or false?", order: "Build the verse", scramble: "Unscramble the word",
  spell: "Spell it", match: "Match the pairs", sequence: "Put in order", write: "Type your answer", reflect: "Your turn to write",
};
