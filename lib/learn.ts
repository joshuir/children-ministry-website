import type { LearnCategory, LearnChallenge, LearnLesson, QuizLevel, QuizQuestion } from "@/lib/types";

/* =============================================================== question bank */

/** Lower-case, strip accents, punctuation and extra spaces — used to compare answers and wording. */
export const simplify = (s: string) =>
  (s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[‘’“”"'`.,;:!?()\-–—…]/g, " ").replace(/\s+/g, " ").trim();

const keyOf = (q: QuizQuestion) => {
  const extra = q.kind === "order" || q.kind === "fill" || q.kind === "scramble" || q.kind === "spell" ? simplify(q.answer)
    : q.kind === "match" ? (q.pairs || []).map((p) => simplify(p.a) + "=" + simplify(p.b)).sort().join("|")
    : q.kind === "sequence" ? (q.items || []).map(simplify).join(">") : "";
  return `${q.track}|${simplify(q.prompt)}|${extra}`;
};

function complete(q: QuizQuestion) {
  if (q.kind === "reflect") return true;
  if (q.kind === "match") return (q.pairs || []).filter((p) => p.a?.trim() && p.b?.trim()).length >= 2;
  if (q.kind === "sequence") return (q.items || []).filter((x) => x?.trim()).length >= 3;
  if (q.kind === "choice" || q.kind === "fill") return !!q.answer?.trim() && (q.options || []).some((o) => o?.trim());
  return !!q.answer?.trim();
}

/**
 * Clean the bank for the public site: drop hidden or incomplete questions and anything that repeats
 * another question's id or wording, so a child is never asked the same thing twice.
 */
export function cleanBank(list: QuizQuestion[] | undefined, categories?: LearnCategory[]): QuizQuestion[] {
  const live = categories ? new Set(categories.filter((c) => !c.hidden).map((c) => c.id)) : null;
  const ids = new Set<string>(), keys = new Set<string>();
  const out: QuizQuestion[] = [];
  for (const raw of list || []) {
    if (!raw || raw.hidden || !raw.id || !raw.prompt?.trim()) continue;
    const q: QuizQuestion = {
      ...raw,
      level: Math.min(5, Math.max(1, Number(raw.level) || 1)) as QuizLevel,
      options: (raw.options || []).map((o) => String(o).trim()).filter(Boolean),
      pairs: (raw.pairs || []).filter((p) => p?.a?.trim() && p?.b?.trim()).map((p) => ({ a: p.a.trim(), b: p.b.trim() })),
      items: (raw.items || []).map((x) => String(x).trim()).filter(Boolean),
    };
    if (!complete(q) || (live && !live.has(q.track))) continue;
    const key = keyOf(q);
    if (ids.has(q.id) || keys.has(key)) continue;
    ids.add(q.id); keys.add(key);
    out.push(q);
  }
  return out;
}

/** Duplicate check for the content manager (shown to staff, never to children). */
export function findDuplicates(list: QuizQuestion[]) {
  const seen = new Map<string, string>(), ids = new Set<string>();
  const dupes: { id: string; of: string; why: "id" | "wording" }[] = [];
  for (const q of list) {
    if (ids.has(q.id)) dupes.push({ id: q.id, of: q.id, why: "id" });
    ids.add(q.id);
    const key = keyOf(q), prev = seen.get(key);
    if (prev) dupes.push({ id: q.id, of: prev, why: "wording" }); else seen.set(key, q.id);
  }
  return dupes;
}

/* =============================================================== marking */

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

/** The answer as a child should see it when they get it wrong. */
export function expectedText(q: QuizQuestion) {
  if (q.kind === "truefalse") return q.answer === "true" ? "True" : "False";
  if (q.kind === "match") return (q.pairs || []).map((p) => `${p.a} → ${p.b}`).join(" · ");
  if (q.kind === "sequence") return (q.items || []).map((x, i) => `${i + 1}. ${x}`).join("  ");
  if (q.kind === "scramble" || q.kind === "spell") return q.answer.toUpperCase();
  return q.answer.split("|")[0];
}

/**
 * Marks an answer.
 *  - match: `given` is JSON {left: right}; every pair must be right.
 *  - sequence: `given` is the items joined by "\n" in the child's order.
 *  - write: forgives case, punctuation and (for words of 5+ letters) one small typo.
 */
export function check(q: QuizQuestion, given: string): Verdict {
  const expected = expectedText(q);
  if (q.kind === "reflect") return { ok: simplify(given).split(" ").filter(Boolean).length >= 2, expected: "" };
  if (q.kind === "match") {
    let map: Record<string, string> = {};
    try { map = JSON.parse(given || "{}"); } catch { /* not an answer */ }
    return { ok: (q.pairs || []).every((p) => map[p.a] === p.b), expected };
  }
  if (q.kind === "sequence") return { ok: given.split("\n").join("\n") === (q.items || []).join("\n"), expected };
  const g = simplify(given);
  const accepted = q.answer.split("|").map(simplify).filter(Boolean);
  if (q.kind === "truefalse") return { ok: g === simplify(expected), expected };
  if (accepted.includes(g)) return { ok: true, expected };
  if (q.kind === "write" && accepted.some((o) => o.length >= 5 && distance(o, g) <= 1)) return { ok: true, close: true, expected };
  return { ok: false, expected };
}

function shuffle<T>(list: T[], seed = Math.random): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(seed() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Shuffled pieces for a question: answer tiles, verse words, puzzle letters, or story events. */
export function choicesFor(q: QuizQuestion): string[] {
  if (q.kind === "truefalse") return ["True", "False"];
  if (q.kind === "choice" || q.kind === "fill") {
    const right = q.answer.split("|")[0];
    return shuffle([right, ...(q.options || []).filter((o) => simplify(o) !== simplify(right)).slice(0, 3)]);
  }
  if (q.kind === "order") return shuffle(q.answer.split(/\s+/).filter(Boolean));
  if (q.kind === "scramble") {
    const letters = q.answer.toUpperCase().replace(/[^A-Z]/g, "").split("");
    for (let t = 0; t < 8; t++) { const s = shuffle(letters); if (s.join("") !== letters.join("") || letters.length < 2) return s; }
    return [...letters].reverse();
  }
  if (q.kind === "sequence") {
    const items = q.items || [];
    for (let t = 0; t < 8; t++) { const s = shuffle(items); if (s.join() !== items.join()) return s; }
    return [...items].reverse();
  }
  return [];
}

/* =============================================================== progress (this device only) */

/**
 * Progress lives only in this browser — no child accounts or names, in line with the site's
 * safeguarding rules. `seen` guarantees each question is asked once across every lesson, category
 * and session; `missed` drives practice.
 */
export interface DayStats { correct: number; lessons: number; perfect: number; byCat: Record<string, number> }
export interface Progress {
  v: 2;
  ageGroup: 1 | 2 | 3;
  xp: number;
  /** Daily XP goal. */
  goal: number;
  streak: number;
  bestStreak: number;
  /** Last day the daily goal was met (YYYY-MM-DD). */
  goalDay: string;
  day: string;
  dayXp: number;
  dayStats: DayStats;
  claimed: string[];
  dailyQuizDay: string;
  hearts: number;
  heartAt: number;
  seen: Record<string, number>;
  missed: Record<string, number>;
  lessons: Record<string, { plays: number; best: number }>;
  totals: { correct: number; answered: number; lessons: number; perfect: number; byCat: Record<string, number>; dailyDone: number };
  badges: Record<string, number>;
  onboarded: boolean;
}

export const MAX_HEARTS = 5;
export const HEART_MS = 20 * 60_000;
export const XP_PER_RIGHT = 10;
export const GOALS = [{ xp: 20, label: "Little steps" }, { xp: 40, label: "Steady walker" }, { xp: 60, label: "Super runner" }];

const KEY = "cm-learn-v2";
const OLD_KEY = "cm-learn-v1";
const emptyDay = (): DayStats => ({ correct: 0, lessons: 0, perfect: 0, byCat: {} });

export const emptyProgress = (): Progress => ({
  v: 2, ageGroup: 1, xp: 0, goal: 20, streak: 0, bestStreak: 0, goalDay: "", day: "", dayXp: 0, dayStats: emptyDay(), claimed: [],
  dailyQuizDay: "", hearts: MAX_HEARTS, heartAt: 0, seen: {}, missed: {}, lessons: {},
  totals: { correct: 0, answered: 0, lessons: 0, perfect: 0, byCat: {}, dailyDone: 0 }, badges: {}, onboarded: false,
});

export const dayOf = (t = Date.now()) => new Date(t).toISOString().slice(0, 10);
const prevDay = (d: string) => dayOf(new Date(d + "T12:00:00Z").getTime() - 864e5);

/** Brings a saved progress object up to today: new-day reset, heart refills, broken streaks. */
export function refresh(p: Progress, now = Date.now()): Progress {
  const today = dayOf(now);
  let next = { ...p };
  if (next.day !== today) {
    next = { ...next, day: today, dayXp: 0, dayStats: emptyDay(), claimed: [], hearts: MAX_HEARTS, heartAt: now };
    if (next.goalDay && next.goalDay !== prevDay(today) && next.goalDay !== today) next.streak = 0;
  }
  if (next.hearts < MAX_HEARTS) {
    const gained = Math.floor((now - (next.heartAt || now)) / HEART_MS);
    if (gained > 0) next = { ...next, hearts: Math.min(MAX_HEARTS, next.hearts + gained), heartAt: next.heartAt + gained * HEART_MS };
  } else next.heartAt = now;
  return next;
}

export function loadProgress(now = Date.now()): Progress {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (raw && raw.v === 2) {
      const base = emptyProgress();
      return refresh({ ...base, ...raw, totals: { ...base.totals, ...(raw.totals || {}) }, dayStats: { ...emptyDay(), ...(raw.dayStats || {}) } }, now);
    }
    // carry over the first version: XP, streak and which questions were already asked
    const old = JSON.parse(localStorage.getItem(OLD_KEY) || "null");
    if (old && old.v === 1) {
      return refresh({ ...emptyProgress(), ageGroup: Math.min(3, Math.max(1, old.level || 1)) as 1 | 2 | 3, xp: old.xp || 0, streak: old.streak || 0, goalDay: old.lastDay || "", seen: old.seen || {}, missed: old.missed || {}, onboarded: true }, now);
    }
  } catch { /* storage blocked or corrupt */ }
  return refresh(emptyProgress(), now);
}

export function saveProgress(p: Progress) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* private mode: progress lasts this visit */ }
}

export function resetProgress() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(OLD_KEY); } catch { /* ignore */ }
}

/* =============================================================== journey */

export const startSection = (p: Progress): QuizLevel => (p.ageGroup === 3 ? 3 : p.ageGroup === 2 ? 2 : 1);

export type NodeState = "done" | "current" | "open" | "locked";
export interface JourneyNode { lesson: LearnLesson; state: NodeState; seen: number; total: number; review: number; index: number }

/** Questions a lesson can draw from (its section's difficulty, topped up from the level below). */
export function lessonPool(bank: QuizQuestion[], lesson: LearnLesson): QuizQuestion[] {
  const inCat = (q: QuizQuestion) => lesson.category === "mixed" || q.track === lesson.category;
  const exact = bank.filter((q) => inCat(q) && q.level === lesson.section);
  if (exact.length >= lesson.size || lesson.section === 1) return exact;
  return [...exact, ...bank.filter((q) => inCat(q) && q.level === lesson.section - 1)];
}

/**
 * The learning journey in order. Sections below the child's starting section are open for practice;
 * from the starting section onward, lessons unlock one at a time.
 */
export function journey(bank: QuizQuestion[], lessons: LearnLesson[], p: Progress): JourneyNode[] {
  const start = startSection(p);
  const list = [...lessons].filter((l) => !l.hidden).sort((a, b) => a.section - b.section);
  let gate = false;
  return list.map((lesson, index) => {
    const pool = lessonPool(bank, lesson);
    const seen = pool.filter((q) => p.seen[q.id]).length;
    const review = pool.filter((q) => p.missed[q.id]).length;
    const played = (p.lessons[lesson.id]?.plays || 0) > 0;
    let state: NodeState;
    if (lesson.section < start) state = played ? "done" : "open";
    else if (played) state = "done";
    else if (!gate) { state = "current"; gate = true; }
    else state = "locked";
    return { lesson, state, seen, total: pool.length, review, index };
  });
}

export type SessionMode = "new" | "practice" | "mastered";

/**
 * Picks a lesson's questions: only ones this child has never seen anywhere (no repeats across
 * lessons, categories or visits). When a lesson has none left, it offers the ones they missed.
 */
export function pickLesson(bank: QuizQuestion[], lesson: LearnLesson, p: Progress): { mode: SessionMode; questions: QuizQuestion[] } {
  const pool = lessonPool(bank, lesson);
  const fresh = pool.filter((q) => !p.seen[q.id]);
  if (fresh.length) {
    const atLevel = shuffle(fresh.filter((q) => q.level === lesson.section));
    const below = shuffle(fresh.filter((q) => q.level !== lesson.section));
    const picked = [...atLevel, ...below];
    // a mixed checkpoint spreads across categories
    if (lesson.category === "mixed") picked.sort((a, b) => countBefore(picked, a) - countBefore(picked, b));
    return { mode: "new", questions: picked.slice(0, lesson.size) };
  }
  const missed = shuffle(pool.filter((q) => p.missed[q.id]));
  if (missed.length) return { mode: "practice", questions: missed.slice(0, lesson.size) };
  return { mode: "mastered", questions: [] };
}

function countBefore(list: QuizQuestion[], q: QuizQuestion) {
  const i = list.indexOf(q);
  return list.slice(0, i).filter((x) => x.track === q.track).length;
}

/** Practice anything missed (all categories) — the way to win hearts back. */
export function pickPractice(bank: QuizQuestion[], p: Progress, size = 6) {
  return shuffle(bank.filter((q) => p.missed[q.id])).slice(0, size);
}

/** Today's quiz: five never-seen questions from different categories, up to the child's level. */
export function pickDaily(bank: QuizQuestion[], p: Progress, size = 5) {
  const max = Math.max(startSection(p), 2) as number;
  const fresh = shuffle(bank.filter((q) => !p.seen[q.id] && q.level <= max && q.kind !== "reflect"));
  const out: QuizQuestion[] = [], used = new Set<string>();
  for (const q of fresh) { if (out.length >= size) break; if (!used.has(q.track)) { out.push(q); used.add(q.track); } }
  for (const q of fresh) { if (out.length >= size) break; if (!out.includes(q)) out.push(q); }
  return out;
}

/* =============================================================== answering & finishing */

/** Records one answer. Wrong answers cost a heart in normal lessons (never in practice). */
export function answer(p: Progress, q: QuizQuestion, ok: boolean, practice = false, now = Date.now()): Progress {
  const counted = ok || q.kind === "reflect";
  const seen = { ...p.seen, [q.id]: now };
  const missed = { ...p.missed };
  if (counted) delete missed[q.id]; else missed[q.id] = now;
  let hearts = p.hearts, heartAt = p.heartAt;
  if (!counted && !practice) { if (hearts === MAX_HEARTS) heartAt = now; hearts = Math.max(0, hearts - 1); }
  if (counted && practice && hearts < MAX_HEARTS) hearts += 1;
  const byCat = { ...p.totals.byCat }, dayCat = { ...p.dayStats.byCat };
  byCat[q.track] = (byCat[q.track] || 0) + 1;
  dayCat[q.track] = (dayCat[q.track] || 0) + 1;
  return {
    ...p, seen, missed, hearts, heartAt,
    totals: { ...p.totals, answered: p.totals.answered + 1, correct: p.totals.correct + (counted ? 1 : 0), byCat },
    dayStats: { ...p.dayStats, correct: p.dayStats.correct + (counted ? 1 : 0), byCat: dayCat },
  };
}

export interface FinishResult { p: Progress; xp: number; bonus: number; goalReached: boolean; streakUp: boolean; challenges: LearnChallenge[]; badges: Badge[] }

/** Adds XP, counts the lesson, then settles the daily goal, streak, challenges and badges. */
export function finish(
  p: Progress,
  o: { lessonId?: string; right: number; total: number; daily?: boolean; practice?: boolean },
  ctx: { challenges: LearnChallenge[]; bank: QuizQuestion[]; lessons: LearnLesson[]; categories: LearnCategory[] },
  now = Date.now(),
): FinishResult {
  const perfect = o.total > 0 && o.right === o.total;
  const xp = o.right * XP_PER_RIGHT + (perfect && !o.practice ? 10 : 0) + (o.daily ? 20 : 0);
  const next: Progress = { ...p, xp: p.xp + xp, dayXp: p.dayXp + xp };
  if (o.lessonId) {
    const prev = next.lessons[o.lessonId] || { plays: 0, best: 0 };
    next.lessons = { ...next.lessons, [o.lessonId]: { plays: prev.plays + 1, best: Math.max(prev.best, o.total ? Math.round((o.right / o.total) * 100) : 0) } };
  }
  next.totals = { ...next.totals, lessons: next.totals.lessons + 1, perfect: next.totals.perfect + (perfect ? 1 : 0), dailyDone: next.totals.dailyDone + (o.daily ? 1 : 0) };
  next.dayStats = { ...next.dayStats, lessons: next.dayStats.lessons + 1, perfect: next.dayStats.perfect + (perfect ? 1 : 0) };
  if (o.daily) next.dailyQuizDay = dayOf(now);

  // daily challenges
  const done: LearnChallenge[] = [];
  let bonus = 0;
  for (const c of todaysChallenges(ctx.challenges, dayOf(now))) {
    if (next.claimed.includes(c.id)) continue;
    if (challengeValue(c, next) >= c.target) { done.push(c); bonus += c.reward; next.claimed = [...next.claimed, c.id]; }
  }
  next.xp += bonus; next.dayXp += bonus;

  // daily goal → streak
  const today = dayOf(now);
  let goalReached = false, streakUp = false;
  if (next.dayXp >= next.goal && next.goalDay !== today) {
    goalReached = true; streakUp = true;
    next.streak = next.goalDay === prevDay(today) ? next.streak + 1 : 1;
    next.bestStreak = Math.max(next.bestStreak, next.streak);
    next.goalDay = today;
  }

  // badges
  const won = BADGES.filter((b) => !next.badges[b.id] && b.progress(next, ctx).have >= b.progress(next, ctx).need);
  if (won.length) next.badges = { ...next.badges, ...Object.fromEntries(won.map((b) => [b.id, now])) };
  return { p: next, xp, bonus, goalReached, streakUp, challenges: done, badges: won };
}

/* =============================================================== daily challenges */

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }

/** Three challenges a day, the same for everyone on that date. */
export function todaysChallenges(list: LearnChallenge[], day = dayOf(), count = 3): LearnChallenge[] {
  const live = (list || []).filter((c) => !c.hidden && c.target > 0);
  return [...live].sort((a, b) => hash(day + a.id) - hash(day + b.id)).slice(0, count);
}

export function challengeValue(c: LearnChallenge, p: Progress) {
  switch (c.metric) {
    case "xp": return p.dayXp;
    case "correct": return p.dayStats.correct;
    case "lessons": return p.dayStats.lessons;
    case "perfect": return p.dayStats.perfect;
    case "category": return p.dayStats.byCat[c.category || ""] || 0;
  }
}

/* =============================================================== badges */

export interface Badge {
  id: string;
  title: string;
  blurb: string;
  icon: "seed" | "flame" | "star" | "crown" | "heart" | "book" | "compass" | "trophy" | "dove" | "scroll";
  tone: "blue" | "sun" | "coral" | "mint" | "lilac";
  progress: (p: Progress, ctx: { bank: QuizQuestion[]; lessons: LearnLesson[]; categories: LearnCategory[] }) => { have: number; need: number };
}

const sectionDone = (p: Progress, lessons: LearnLesson[], s: number) => {
  const ids = lessons.filter((l) => l.section === s && !l.hidden).map((l) => l.id);
  return { have: ids.filter((id) => p.lessons[id]?.plays).length, need: Math.max(1, ids.length) };
};

export const BADGES: Badge[] = [
  { id: "first-step", title: "First step", blurb: "Finish your first lesson.", icon: "seed", tone: "mint", progress: (p) => ({ have: p.totals.lessons, need: 1 }) },
  { id: "streak-3", title: "On fire", blurb: "Reach your daily goal 3 days in a row.", icon: "flame", tone: "coral", progress: (p) => ({ have: p.bestStreak, need: 3 }) },
  { id: "streak-7", title: "Faithful week", blurb: "A 7-day streak.", icon: "flame", tone: "sun", progress: (p) => ({ have: p.bestStreak, need: 7 }) },
  { id: "streak-30", title: "Faithful month", blurb: "A 30-day streak.", icon: "crown", tone: "lilac", progress: (p) => ({ have: p.bestStreak, need: 30 }) },
  { id: "xp-100", title: "Bright light", blurb: "Earn 100 XP.", icon: "star", tone: "sun", progress: (p) => ({ have: p.xp, need: 100 }) },
  { id: "xp-500", title: "Shining star", blurb: "Earn 500 XP.", icon: "star", tone: "blue", progress: (p) => ({ have: p.xp, need: 500 }) },
  { id: "xp-1500", title: "City on a hill", blurb: "Earn 1,500 XP.", icon: "trophy", tone: "coral", progress: (p) => ({ have: p.xp, need: 1500 }) },
  { id: "perfect", title: "Spot on", blurb: "Finish a lesson with no mistakes.", icon: "heart", tone: "coral", progress: (p) => ({ have: p.totals.perfect, need: 1 }) },
  { id: "verses-15", title: "Verse keeper", blurb: "Answer 15 memory verse questions.", icon: "scroll", tone: "sun", progress: (p) => ({ have: p.totals.byCat.verses || 0, need: 15 }) },
  { id: "explorer", title: "Explorer", blurb: "Play every kind of game.", icon: "compass", tone: "mint", progress: (p, c) => { const cats = c.categories.filter((x) => !x.hidden); return { have: cats.filter((x) => p.totals.byCat[x.id]).length, need: cats.length }; } },
  { id: "answers-100", title: "Bible scholar", blurb: "Answer 100 questions.", icon: "book", tone: "blue", progress: (p) => ({ have: p.totals.answered, need: 100 }) },
  { id: "daily-5", title: "Daily dove", blurb: "Finish 5 daily quizzes.", icon: "dove", tone: "lilac", progress: (p) => ({ have: p.totals.dailyDone, need: 5 }) },
  { id: "seeds", title: "Seeds sown", blurb: "Finish every lesson in Seeds.", icon: "seed", tone: "mint", progress: (p, c) => sectionDone(p, c.lessons, 1) },
  { id: "branches", title: "Branching out", blurb: "Finish every lesson in Branches.", icon: "crown", tone: "blue", progress: (p, c) => sectionDone(p, c.lessons, 3) },
  { id: "fruit", title: "Fruitful", blurb: "Finish every lesson in Fruit.", icon: "trophy", tone: "lilac", progress: (p, c) => sectionDone(p, c.lessons, 5) },
];

/* =============================================================== team league */

/** ISO week key, e.g. 2026-W44 — the league resets every Monday. */
export function weekKey(t = Date.now()) {
  const d = new Date(t); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const y = d.getUTCFullYear(), w = Math.ceil(((d.getTime() - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return `${y}-W${String(w).padStart(2, "0")}`;
}
