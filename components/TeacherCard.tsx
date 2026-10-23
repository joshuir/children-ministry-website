import Link from "next/link";
import clsx from "clsx";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import type { ClassInfo, Teacher, Tone } from "@/lib/types";

export const toneFrame: Record<Tone, string> = {
  blue: "from-brand-400 to-brand-600 text-white",
  sun: "from-sun-300 to-sun-400 text-ink",
  coral: "from-coral-400 to-coral-600 text-white",
  mint: "from-mint-400 to-mint-600 text-white",
  lilac: "from-lilac-400 to-ink text-white",
  ink: "from-ink-soft to-ink text-white",
};

export const initialsOf = (name: string) => name.split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();

/** 4:5 portrait. Uses the uploaded photo, or a bold monogram portrait until one is added. */
export function TeacherPortrait({ teacher, className, big }: { teacher: Teacher; className?: string; big?: boolean }) {
  return (
    <div className={clsx("relative aspect-[4/5] w-full overflow-hidden rounded-[1.75rem] bg-gradient-to-br", toneFrame[teacher.tone], className)}>
      {teacher.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={teacher.photo} alt={`Portrait of ${teacher.name}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
      ) : (
        <>
          <svg aria-hidden viewBox="0 0 200 250" className="absolute inset-0 h-full w-full opacity-25" preserveAspectRatio="xMidYMid slice">
            <defs><pattern id={`dots-${teacher.id}`} width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="currentColor" /></pattern></defs>
            <rect width="200" height="250" fill={`url(#dots-${teacher.id})`} />
          </svg>
          <span aria-hidden className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 transition-transform duration-500 group-hover:scale-125" />
          <span aria-hidden className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-black/10" />
          {/* simple head-and-shoulders silhouette */}
          <svg aria-hidden viewBox="0 0 200 250" className="absolute inset-x-0 bottom-0 h-[78%] w-full opacity-30 transition-transform duration-500 group-hover:translate-y-1">
            <circle cx="100" cy="95" r="44" fill="currentColor" />
            <path d="M20 250c4-58 40-92 80-92s76 34 80 92z" fill="currentColor" />
          </svg>
          <span aria-hidden className={clsx("absolute left-5 top-4 font-display font-extrabold leading-none tracking-tighter", big ? "text-7xl" : "text-5xl")}>{initialsOf(teacher.name)}</span>
        </>
      )}
      {teacher.checked !== false && (
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink shadow-card">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />Safeguarding checked
        </span>
      )}
    </div>
  );
}

/** Teacher card: portrait, name, role, the classes they lead and a "since" year. */
export function TeacherCard({ teacher, classes = [], onOpen, compact }: { teacher: Teacher; classes?: ClassInfo[]; onOpen?: () => void; compact?: boolean }) {
  const theirs = classes.filter((c) => teacher.classIds.includes(c.id));
  const Body = (
    <>
      <TeacherPortrait teacher={teacher} />
      <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-xl font-semibold leading-tight tracking-tight text-ink">{teacher.name}</h3>
            <p className="mt-1 text-sm font-semibold text-ink-mute">{teacher.role}</p>
          </div>
          <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-paper text-ink transition-[background-color,color,transform] duration-150 group-hover:rotate-45 group-hover:bg-brand-500 group-hover:text-white">
            <ArrowUpRight className="h-5 w-5" />
          </span>
        </div>
        {!compact && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {theirs.length ? theirs.map((c) => <span key={c.id} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">{c.name}</span>) : <span className="rounded-full bg-sun-100 px-2.5 py-1 text-xs font-bold text-sun-600">Ministry team</span>}
            {teacher.since && <span className="rounded-full bg-paper px-2.5 py-1 text-xs font-bold text-ink-mute ring-1 ring-ink/5">Since {teacher.since}</span>}
          </div>
        )}
      </div>
    </>
  );
  const cls = "group flex h-full w-full flex-col rounded-[2rem] bg-white p-2.5 text-left shadow-card ring-1 ring-ink/5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-500";
  if (onOpen) return <button type="button" data-card onClick={onOpen} aria-haspopup="dialog" aria-label={`${teacher.name}, ${teacher.role} — open profile`} className={cls}>{Body}</button>;
  return <Link href={`/about/?teacher=${teacher.id}#teachers`} data-card aria-label={`${teacher.name}, ${teacher.role} — open profile`} className={cls}>{Body}</Link>;
}
