import { ConsentGate } from "./ConsentGate";
import clsx from "clsx";
import { BookMarked, Download, FileText, HandHeart, Headphones, Image as ImageIcon, Lightbulb, MessageCircleQuestion, Puzzle, Target, Video } from "lucide-react";
import { fmtDate } from "@/lib/format";
import { Scene } from "./Scene";
import type { BibleLesson as Lesson, Resource } from "@/lib/types";

const resIcon: Record<Resource["type"], typeof FileText> = { pdf: FileText, image: ImageIcon, audio: Headphones, video: Video };

function Block({ icon: Icon, title, tone, children, id }: { icon: typeof FileText; title: string; tone: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} data-reveal className="scroll-mt-28 rounded-4xl bg-white p-6 shadow-card ring-1 ring-ink/5 md:p-8">
      <h2 className="mb-4 flex items-center gap-3 font-display text-2xl font-semibold tracking-tight text-ink">
        <span className={clsx("flex h-11 w-11 items-center justify-center rounded-2xl", tone)}><Icon className="h-5 w-5" /></span>{title}
      </h2>
      {children}
    </section>
  );
}

/** The picture or video that goes with the lesson. */
export function LessonMedia({ media, className }: { media: NonNullable<Lesson["media"]>; className?: string }) {
  const video = /\.(mp4|webm|mov|m4v)(\?|$)/i.test(media.src || "");
  const yt = (media.src || "").match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/);
  return (
    <figure data-reveal="image" className={clsx("overflow-hidden rounded-4xl bg-ink shadow-card", className)}>
      {!media.src ? (
        <div className="relative aspect-[16/7] w-full"><Scene scene={media.scene || "bible"} tone={media.tone || "blue"} title={media.alt} className="h-full w-full" /></div>
      ) : yt ? (
        <ConsentGate label="video" href={`https://www.youtube.com/watch?v=${yt[1]}`} className="aspect-video w-full !rounded-none">
          <iframe src={`https://www.youtube-nocookie.com/embed/${yt[1]}`} title={media.alt || "Lesson video"} className="aspect-video w-full" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
        </ConsentGate>
      ) : video ? (
        <video src={media.src} controls playsInline preload="metadata" className="aspect-video w-full bg-ink object-contain" aria-label={media.alt} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={media.src} alt={media.alt} className="aspect-[16/9] w-full object-cover" loading="lazy" />
      )}
      {media.src && media.alt && <figcaption className="px-5 py-3 text-sm font-semibold text-white/70">{media.alt}</figcaption>}
    </figure>
  );
}

/** The structured Bible lesson layout used for every class and every week. */
export function BibleLesson({ lesson }: { lesson: Lesson }) {
  const toc = [
    ["objective", "Objective"], ["story", "Bible story"], ["questions", "Discussion"], ["activity", "Activity"], ["prayer", "Prayer"], ["resources", "Resources"],
  ];
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav aria-label="Lesson sections" className="hidden lg:block">
        <ol className="sticky top-28 grid gap-1 rounded-3xl bg-white p-3 ring-1 ring-ink/5">
          {toc.map(([id, label], i) => (
            <li key={id}><a href={`#${id}`} className="flex min-h-[44px] items-center gap-3 rounded-2xl px-3 font-semibold text-ink-soft hover:bg-brand-50 hover:text-ink"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/5 text-xs font-bold">{i + 1}</span>{label}</a></li>
          ))}
        </ol>
      </nav>

      <div className="grid min-w-0 gap-6">
        <LessonMedia media={lesson.media?.src ? lesson.media : { alt: lesson.title, scene: lesson.media?.scene || "bible", tone: lesson.media?.tone || "blue" }} />
        {/* Memory verse */}
        <figure data-reveal className="relative overflow-hidden rounded-4xl bg-ink px-6 py-10 text-white md:px-12 md:py-14">
          <svg aria-hidden viewBox="0 0 200 200" className="absolute -right-10 -top-10 w-56 text-brand-500/30"><circle cx="100" cy="100" r="100" fill="currentColor" /></svg>
          <p className="relative flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] text-sun-300"><BookMarked className="h-4 w-4" />Memory verse</p>
          <blockquote className="relative mt-4 font-display text-[calc(var(--h-scale)*clamp(1.75rem,4vw,2.75rem))] font-semibold leading-[1.1] tracking-tight">“{lesson.memoryVerse.text}”</blockquote>
          <figcaption className="relative mt-5 inline-flex rounded-full bg-sun-400 px-4 py-1.5 font-bold text-ink">{lesson.memoryVerse.reference}</figcaption>
        </figure>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Block id="objective" icon={Target} title="Lesson objective" tone="bg-brand-100 text-brand-700">
            <p className="text-lg leading-relaxed text-ink-soft">{lesson.objective}</p>
          </Block>
          <Block icon={Lightbulb} title="Topic" tone="bg-sun-100 text-sun-600">
            <p className="font-display text-2xl font-semibold text-ink">{lesson.topic}</p>
            <p className="mt-2 text-ink-mute">{lesson.reference} · taught {fmtDate(lesson.date)}</p>
          </Block>
        </div>

        <Block id="story" icon={BookMarked} title="The Bible story" tone="bg-mint-100 text-mint-600">
          <div className="max-w-[68ch] space-y-4 text-[18px] leading-[1.75] text-ink-soft">
            {lesson.story.map((p, i) => <p key={i} className={i === 0 ? "first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:font-bold first-letter:leading-[0.85] first-letter:text-brand-500" : ""}>{p}</p>)}
          </div>
          <p className="mt-5 text-sm text-ink-mute">Read it together: {lesson.reference}</p>
        </Block>

        <Block id="questions" icon={MessageCircleQuestion} title="Discussion questions" tone="bg-coral-100 text-coral-600">
          <ol className="grid gap-3">
            {lesson.questions.map((q, i) => (
              <li key={i} className="flex gap-4 rounded-2xl bg-paper p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral-400 font-display font-bold text-white">{i + 1}</span><span className="pt-0.5 text-lg leading-snug text-ink">{q}</span></li>
            ))}
          </ol>
        </Block>

        <Block id="activity" icon={Puzzle} title={`Activity: ${lesson.activity.title}`} tone="bg-lilac-100 text-lilac-400">
          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {lesson.activity.steps.map((s, i) => (
              <li key={i} className="rounded-3xl bg-lilac-100/60 p-5"><span className="font-display text-sm font-bold uppercase tracking-wider text-lilac-400">Step {i + 1}</span><p className="mt-1 leading-snug text-ink">{s}</p></li>
            ))}
          </ol>
        </Block>

        <Block id="prayer" icon={HandHeart} title="Prayer" tone="bg-sun-100 text-sun-600">
          <p className="rounded-3xl bg-sun-100 p-6 font-display text-xl leading-relaxed text-ink">{lesson.prayer}</p>
        </Block>

        <Block id="resources" icon={Download} title="Downloadable resources" tone="bg-brand-100 text-brand-700">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {lesson.resources.map((r) => {
              const Icon = resIcon[r.type];
              return (
                <li key={r.label}>
                  <a href={r.url} download className="group flex h-full items-center gap-3 rounded-2xl p-3 ring-1 ring-ink/10 transition-all hover:-translate-y-0.5 hover:ring-brand-500">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-white"><Icon className="h-5 w-5" /></span>
                    <span className="min-w-0"><span className="block truncate font-semibold text-ink">{r.label}</span><span className="text-sm uppercase text-ink-mute">{r.type} · {r.size}</span></span>
                  </a>
                </li>
              );
            })}
          </ul>
        </Block>
      </div>
    </div>
  );
}
