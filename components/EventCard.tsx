import clsx from "clsx";
import { ArrowUpRight, Clock, MapPin } from "lucide-react";
import { Scene } from "./Scene";
import { dayMonth } from "@/lib/format";
import type { EventItem } from "@/lib/types";

export function EventCard({ event, featured = false }: { event: EventItem; featured?: boolean }) {
  const { day, month } = dayMonth(event.date);
  return (
    <article data-reveal data-card className={clsx("group flex h-full overflow-hidden rounded-[1.75rem] bg-white shadow-card ring-1 ring-ink/[0.07]", featured ? "flex-col md:flex-row" : "flex-col")}>
      <div data-card-media className={clsx("relative", featured ? "aspect-[16/10] md:aspect-auto md:w-1/2" : "aspect-[16/10]")}>
        <Scene scene={event.scene} tone={event.tone} className="h-full w-full" />
      </div>
      <div className={clsx("relative flex flex-1 flex-col p-6", featured && "md:justify-center md:p-10")}>
        <div className="flex items-start justify-between gap-4">
          <p data-pop className="flex shrink-0 flex-col items-center rounded-2xl bg-brand-50 px-3 py-1.5 text-center">
            <span className="font-display text-2xl font-bold leading-none text-ink">{day}</span>
            <span className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-brand-600">{month}</span>
          </p>
          <span data-card-arrow aria-hidden className="flex h-10 w-10 items-center justify-center rounded-full bg-ink/[0.05] text-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-white"><ArrowUpRight className="h-4 w-4" /></span>
        </div>
        <h3 className={clsx("mt-4 font-display font-bold leading-tight tracking-tight text-ink", featured ? "text-3xl" : "text-xl")}>{event.title}</h3>
        <p className={clsx("mt-2 leading-relaxed text-ink-mute", featured ? "text-lg" : "flex-1")}>{event.summary}</p>
        <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t border-ink/[0.07] pt-4 text-sm font-semibold text-ink-soft">
          <li className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-brand-500" />{event.time}</li>
          <li className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand-500" />{event.location}</li>
        </ul>
      </div>
    </article>
  );
}
