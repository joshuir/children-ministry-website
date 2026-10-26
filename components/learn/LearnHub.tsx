"use client";

import { isReduced } from "@/lib/motion-pref";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { BookOpen, Flame, Lock, MapPinned, PenLine, Sparkles, Star, Users } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { LEVELS, TRACKS } from "@/content/learn";
import { emptyProgress, loadProgress, saveProgress, trackStats, type Progress } from "@/lib/learn";
import type { QuizLevel, QuizQuestion, QuizTrack } from "@/lib/types";

const icons: Record<QuizTrack, typeof BookOpen> = { scripture: BookOpen, verses: Sparkles, characters: Users, places: MapPinned, writing: PenLine };
const toneFill: Record<string, string> = { blue: "bg-brand-500 text-white", sun: "bg-sun-400 text-ink", coral: "bg-coral-400 text-white", mint: "bg-mint-400 text-ink", lilac: "bg-lilac-400 text-white" };
const toneStroke: Record<string, string> = { blue: "#2563EB", sun: "#E9A100", coral: "#FF7A59", mint: "#1565C0", lilac: "#1E3A8A" };
// Zig-zag offsets for the path (in % of the column), like stepping stones.
const offsets = [0, 34, 10, -30, 4];

function Ring({ value, color }: { value: number; color: string }) {
  const r = 46, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" className="absolute -inset-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] -rotate-90" aria-hidden>
      <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-ink/[0.07]" />
      <circle data-ring cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value)} style={{ transition: "stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)" }} />
    </svg>
  );
}

export function LearnHub({ bank }: { bank: QuizQuestion[] }) {
  const [p, setP] = useState<Progress>(emptyProgress);
  const [ready, setReady] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => { setP(loadProgress()); setReady(true); }, []);

  function setLevel(level: QuizLevel) {
    const next = { ...p, level };
    setP(next);
    saveProgress(next);
  }

  useGSAP(() => {
    if (!ready || isReduced()) return;
    gsap.fromTo("[data-node]", { scale: 0.6, autoAlpha: 0, y: 20 }, { scale: 1, autoAlpha: 1, y: 0, duration: 0.6, ease: "back.out(1.7)", stagger: 0.09 });
    gsap.fromTo("[data-path-line]", { strokeDashoffset: 1000 }, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" });
    // a gentle bounce on the next game to play
    gsap.to("[data-next] [data-bob]", { y: -6, duration: 0.9, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 0.8 });
  }, { scope: root, dependencies: [ready, p.level] });

  const stats = TRACKS.map((t) => ({ ...t, ...trackStats(bank, p, t.id) }));
  const next = stats.find((s) => s.left > 0)?.id ?? stats.find((s) => s.review > 0)?.id;
  const answered = Object.keys(p.seen).length;

  return (
    <div ref={root} className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      {/* the path */}
      <section aria-label="Bible games" className="relative mx-auto w-full max-w-md py-4">
        <svg aria-hidden viewBox="0 0 200 1000" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
          <path data-path-line d="M100 40 C 180 160, 180 220, 140 260 S 60 420, 110 470 S 200 640, 60 700 S 20 880, 108 940" fill="none" stroke="#B9CEFF" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 14" style={{ strokeDasharray: "1000", strokeDashoffset: 0 }} />
        </svg>
        <ol className="relative grid gap-10">
          {stats.map((t, i) => {
            const Icon = icons[t.id];
            const done = t.total > 0 && t.left === 0;
            const progress = t.total ? t.done / t.total : 0;
            const empty = t.total === 0;
            return (
              <li key={t.id} style={{ transform: `translateX(${offsets[i % offsets.length]}%)` }} {...(t.id === next ? { "data-next": "" } : {})}>
                <div data-node className="flex flex-col items-center">
                <Link
                  href={empty ? "#" : `/learn/${t.id}/`}
                  aria-disabled={empty}
                  onClick={(e) => empty && e.preventDefault()}
                  aria-label={`${t.title}: ${ready ? `${t.done} of ${t.total} questions answered` : ""}${t.review ? `, ${t.review} to practise` : ""}`}
                  className="group relative flex h-24 w-24 items-center justify-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-sun-400 sm:h-28 sm:w-28"
                >
                  {ready && <Ring value={progress} color={toneStroke[t.tone]} />}
                  <span data-bob className={clsx("relative flex h-full w-full items-center justify-center rounded-full shadow-[0_6px_0_0_rgba(11,21,48,.18)] transition-transform duration-150 group-hover:-translate-y-1 group-active:translate-y-1 group-active:shadow-none", empty ? "bg-ink/10 text-ink/40" : toneFill[t.tone])}>
                    {empty ? <Lock className="h-8 w-8" /> : <Icon className="h-10 w-10" strokeWidth={2.2} />}
                    {done && <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-card ring-2 ring-sun-400"><Star className="h-4 w-4 fill-sun-400 text-sun-400" /></span>}
                  </span>
                  {t.id === next && ready && <span className="absolute -top-9 whitespace-nowrap rounded-full bg-ink px-3 py-1 text-xs font-extrabold uppercase tracking-[0.08em] text-white after:absolute after:left-1/2 after:top-full after:-ml-1.5 after:border-[6px] after:border-transparent after:border-t-ink">Start here</span>}
                </Link>
                <p className="mt-3 text-center font-display text-lg font-bold leading-tight">{t.title}</p>
                <p className="text-center text-sm font-semibold text-ink-mute" aria-hidden>{ready ? (empty ? "Coming soon" : done ? (t.review ? `${t.review} to practise` : "All done!") : `${t.done}/${t.total}`) : " "}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* side panel: stats + age group */}
      <aside className="grid gap-4 lg:sticky lg:top-28">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-3xl bg-white p-4 text-center ring-1 ring-ink/5"><Star className="mx-auto h-6 w-6 fill-sun-400 text-sun-400" /><b className="mt-1 block font-display text-2xl">{ready ? p.xp : "–"}</b><span className="text-xs font-bold uppercase tracking-[0.08em] text-ink-mute">XP</span></div>
          <div className="rounded-3xl bg-white p-4 text-center ring-1 ring-ink/5"><Flame className="mx-auto h-6 w-6 fill-coral-400 text-coral-400" /><b className="mt-1 block font-display text-2xl">{ready ? p.streak : "–"}</b><span className="text-xs font-bold uppercase tracking-[0.08em] text-ink-mute">Day streak</span></div>
          <div className="rounded-3xl bg-white p-4 text-center ring-1 ring-ink/5"><BookOpen className="mx-auto h-6 w-6 text-brand-500" /><b className="mt-1 block font-display text-2xl">{ready ? answered : "–"}</b><span className="text-xs font-bold uppercase tracking-[0.08em] text-ink-mute">Answered</span></div>
        </div>
        <fieldset className="rounded-4xl bg-white p-5 ring-1 ring-ink/5">
          <legend className="sr-only">Choose your age group</legend>
          <p className="font-display text-lg font-bold">Your age group</p>
          <p className="text-sm text-ink-mute">Questions match your class. Older groups also get the easier ones.</p>
          <div className="mt-4 grid gap-2">
            {LEVELS.map((l) => (
              <label key={l.id} className={clsx("flex min-h-[52px] cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 py-2 ring-2 transition-colors duration-150", p.level === l.id && ready ? "bg-brand-50 ring-brand-500" : "ring-ink/10 hover:bg-paper")}>
                <span><b className="block font-display">{l.label}</b><span className="text-sm text-ink-mute">{l.ages}</span></span>
                <input type="radio" name="level" className="h-5 w-5 accent-brand-500" checked={ready && p.level === l.id} onChange={() => setLevel(l.id)} />
              </label>
            ))}
          </div>
        </fieldset>
        <p className="px-2 text-xs leading-relaxed text-ink-mute">Progress is saved on this device only — no sign-in, no names. Each question is asked once; ones you miss come back for practice.</p>
      </aside>
    </div>
  );
}
