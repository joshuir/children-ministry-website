import Link from "next/link";
import clsx from "clsx";
import { ArrowUpRight, BookOpen, MapPin } from "lucide-react";
import type { BibleLesson, ClassInfo, Teacher, Tone } from "@/lib/types";

export const toneBg: Record<Tone, string> = { blue: "bg-brand-500", sun: "bg-sun-400", coral: "bg-coral-400", mint: "bg-mint-400", lilac: "bg-lilac-400", ink: "bg-ink" };
export const toneSoft: Record<Tone, string> = { blue: "bg-brand-50", sun: "bg-sun-100", coral: "bg-coral-100", mint: "bg-mint-100", lilac: "bg-lilac-100", ink: "bg-ink/5" };

export function ClassCard({ cls, tone, teachers, lesson }: { cls: ClassInfo; tone: Tone; teachers: Teacher[]; lesson?: BibleLesson }) {
  const number = cls.name.match(/\d+$/)?.[0];
  return (
    <Link
      href={`/classes/${cls.id}/`}
      data-reveal
      data-card
      data-cursor="Open"
      className="group flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-white p-6 shadow-card ring-1 ring-ink/[0.07] md:p-7"
    >
      <div className="flex items-start justify-between">
        <span data-pop className={clsx("flex h-14 w-14 items-center justify-center rounded-2xl font-display text-2xl font-bold", toneBg[tone], tone === "sun" || tone === "mint" ? "text-ink" : "text-white")}>{number}</span>
        <span data-card-arrow className="flex h-11 w-11 items-center justify-center rounded-full bg-ink/[0.05] text-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-white group-focus-visible:bg-ink group-focus-visible:text-white"><ArrowUpRight className="h-5 w-5" /></span>
      </div>
      <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-ink-mute">{cls.ages}</p>
      <h3 className="mt-1 font-display text-[1.65rem] font-bold leading-tight tracking-tight text-ink">{cls.name}</h3>
      <p className="mt-3 flex-1 leading-relaxed text-ink-mute">{cls.description}</p>
      {lesson && (
        <div className={clsx("mt-5 rounded-2xl p-4", toneSoft[tone])}>
          <p className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-soft"><BookOpen className="h-3.5 w-3.5" />This Sunday</p>
          <p className="mt-1 font-display text-lg font-semibold leading-snug text-ink">{lesson.title}</p>
          <p className="text-sm text-ink-mute">{lesson.reference}</p>
        </div>
      )}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-ink/[0.07] pt-4 text-sm">
        <span className="min-w-0 truncate text-ink-mute">With <span className="font-semibold text-ink">{teachers.map((t) => t.name).join(" & ")}</span></span>
        <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-ink-mute"><MapPin className="h-3.5 w-3.5" />{cls.room}</span>
      </div>
    </Link>
  );
}
