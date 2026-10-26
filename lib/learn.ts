import type { QuizLevel, QuizQuestion, QuizTrack } from "@/lib/types";

/* ------------------------------------------------------------ the question bank */

/** Lower-case, strip punctuation and extra spaces — used to compare answers and wording. */
export const simplify = (s: string) =>
  (s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[‘’“”"'`.,;:!?()\-–—]/g, " ").replace(/\s+/g, " ").trim();

/**
 * Clean the bank for the public site: drop hidden or incomplete questions and anything that repeats
 * another question's id or wording, so a child can never be asked the same thing twice.
 */
export function cleanBank(list: QuizQuestion[]): QuizQuestion[] {
  const ids = new Set<string>(), prompts = new Set<string>();
  const out: QuizQuestion[] = [];
  for (const q of list || []) {
    if (!q || q.hidden || !q.id || !q.prompt?.trim()) continue;
    if (q.kind !== "reflect" && !q.answer?.trim()) continue;
    const key = `${q.track}|${simplify(q.prompt)}|${q.kind === "order" || q.kind === "fill" ? simplify(q.answer) : ""}`;
    if (ids.has(q.id) || prompts.has(key)) continue;
    ids.add(q.id); prompts.add(key);
    out.push({ ...q, level: (Number(q.level) || 1) as QuizLevel, options: (q.options || []).map((o) => o.trim()).filter(Boolean) });
  }
  return out;
}

/** Duplicate checks for the content manager (shown to staff, never to children). */
export function findDuplicates(list: QuizQuestion[]) {
  const seen = new Map<string, string>();
  const dupes: { id: string; of: string }[] = [];
  for (const q of list) {
    const key = `${q.track}|${simplify(q.prompt)}|${q.kind === "order" || q.kind === "fill" ? simplify(q.answer) : ""}`;
    const prev = seen.get(key);
    if (prev) dupes.push({ id: q.id, of: prev }); else seen.set(key, q.id);
  }
  return dupes;
}

/* ------------------------------------------------------------ answers */

function distance(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

export type Verdict = { ok: boolean; close?: boolean; expected: string };

/** Marks an answer. Typed answers forgive case, punctuation and (for longer words) one small typo. */
export function check(q: QuizQuestion, given: string): Verdict {
  const expected = q.kind === "truefalse" ? (q.answer === "true" ? "True" : "False") : q.answer.split("|")[0];
  if (q.kind === "reflect") return { ok: simplify(given).split(" ").filter(Boolean).length >= 2, expected: "" };
  const g = simplify(given);
  const options = q.answer.split("|").map(simplify).filter(Boolean);
  if (options.includes(g)) return { ok: true, expected };
  if (q.kind === "write") {
    const near = options.some((o) => o.length >= 5 && distance(o, g) <= 1);
    if (near) return { ok: true, close: true, expected };
  }
  return { ok: false, expected };
}

/* ------------------------------------------------------------ progress (this device only) */

/**
 * Progress lives only in this browser — no child accounts or names, in line with the site's
 * safeguarding rules. `seen` makes sure each question is asked once; `missed` drives review.
 */
export interface Progress {
  v: 1;
  level: QuizLevel;
  xp: number;
  streak: number;
  lastDay: string;
  seen: Record<string, number>;
  missed: Record<string, number>;
}

const KEY = "cm-learn-v1";
export const emptyProgress = (): Progress => ({ v: 1, level: 1, xp: 0, streak: 0, lastDay: "", seen: {}, missed: {} });

export function loadProgress(): Progress {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && raw.v === 1) return { ...emptyProgress(), ...raw };
  } catch { /* storage blocked or corrupt */ }
  return emptyProgress();
}

export function saveProgress(p: Progress) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode: progress lasts this visit */ }
}

const today = () => new Date().toISOString().slice(0, 10);

/** Called when a lesson finishes: adds XP and keeps the day streak going. */
export function finishLesson(p: Progress, xp: number): Progress {
  const t = today();
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const streak = p.lastDay === t ? p.streak : p.lastDay === y ? p.streak + 1 : 1;
  return { ...p, xp: p.xp + xp, streak, lastDay: t };
}

export function record(p: Progress, id: string, ok: boolean): Progress {
  const seen = { ...p.seen, [id]: Date.now() };
  const missed = { ...p.missed };
  if (ok) delete missed[id]; else missed[id] = Date.now();
  return { ...p, seen, missed };
}

/** Questions a child can play on a track at a level (their level and the ones below it). */
export const poolFor = (bank: QuizQuestion[], track: QuizTrack, level: QuizLevel) =>
  bank.filter((q) => q.track === track && q.level <= level);

export function trackStats(bank: QuizQuestion[], p: Progress, track: QuizTrack) {
  const pool = poolFor(bank, track, p.level);
  const done = pool.filter((q) => p.seen[q.id]).length;
  const review = pool.filter((q) => p.missed[q.id]).length;
  return { total: pool.length, done, review, left: pool.length - done };
}

function shuffle<T>(list: T[]): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export type SessionMode = "new" | "review" | "done";

/**
 * Picks a lesson: only questions this child has never seen (current level first, then easier ones).
 * When everything is seen, it switches to the questions they got wrong. Never repeats inside a lesson.
 */
export function pickSession(bank: QuizQuestion[], p: Progress, track: QuizTrack, size = 8): { mode: SessionMode; questions: QuizQuestion[] } {
  const pool = poolFor(bank, track, p.level);
  const fresh = pool.filter((q) => !p.seen[q.id]).sort((a, b) => b.level - a.level);
  if (fresh.length) {
    const atLevel = shuffle(fresh.filter((q) => q.level === p.level));
    const easier = shuffle(fresh.filter((q) => q.level < p.level));
    return { mode: "new", questions: [...atLevel, ...easier].slice(0, size) };
  }
  const missed = shuffle(pool.filter((q) => p.missed[q.id]));
  if (missed.length) return { mode: "review", questions: missed.slice(0, size) };
  return { mode: "done", questions: [] };
}

/** Answer choices for a question, shuffled (always includes the right answer). */
export function choicesFor(q: QuizQuestion): string[] {
  if (q.kind === "truefalse") return ["True", "False"];
  if (q.kind === "choice" || q.kind === "fill") {
    const right = q.answer.split("|")[0];
    const wrong = (q.options || []).filter((o) => simplify(o) !== simplify(right));
    return shuffle([right, ...wrong.slice(0, 3)]);
  }
  if (q.kind === "order") return shuffle(q.answer.split(/\s+/).filter(Boolean));
  return [];
}
