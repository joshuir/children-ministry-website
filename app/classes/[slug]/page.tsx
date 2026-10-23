import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { ArrowRight, BookOpen, ChevronRight, Clock, MapPin, Users } from "lucide-react";
import { Button, Decor, MediaFrame } from "@/components/ui";
import { TeacherCard } from "@/components/TeacherCard";
import { toneBg } from "@/components/ClassCard";
import { getClass, getClasses, getGallery, getGroups, getLessonsFor, getTeachersFor } from "@/lib/content";
import { fmtDate } from "@/lib/format";

export async function generateStaticParams() {
  return (await getClasses()).map((c) => ({ slug: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = await getClass((await params).slug);
  if (!c) return {};
  return { title: `${c.name} (${c.ages})`, description: c.description, alternates: { canonical: `/classes/${c.id}/` } };
}

export default async function ClassPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cls = await getClass(slug);
  if (!cls) notFound();
  const [groups, lessons, teachers, gallery] = await Promise.all([getGroups(), getLessonsFor(cls.id), getTeachersFor(cls.teacherIds), getGallery()]);
  const group = groups.find((g) => g.id === cls.group)!;
  const [current, ...previous] = lessons;
  const dark = group.tone === "lilac" || group.tone === "coral";

  return (
    <>
      <section className={clsx("relative overflow-hidden pb-16 pt-32 md:pt-40", { sun: "bg-sun-100", mint: "bg-mint-100", coral: "bg-coral-100", lilac: "bg-lilac-100", blue: "bg-brand-50", ink: "bg-ink" }[group.tone])}>
        <Decor />
        <div className="container relative">
          <nav aria-label="Breadcrumb" data-reveal className="mb-6 flex flex-wrap items-center gap-1 text-sm font-semibold text-ink-mute">
            <Link href="/classes/" className="hover:text-ink">Classes</Link><ChevronRight className="h-4 w-4" />
            <Link href={`/classes/#${group.id}`} className="hover:text-ink">{group.name}</Link><ChevronRight className="h-4 w-4" />
            <span aria-current="page" className="text-ink">{cls.name}</span>
          </nav>
          <div className="grid items-end gap-10 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <h1 data-reveal className="font-display text-[calc(var(--h-scale)*clamp(3rem,8vw,6rem))] font-extrabold leading-[0.9] tracking-[-0.04em]">{cls.name}</h1>
              <p data-reveal className="mt-6 max-w-xl text-xl leading-relaxed text-ink-soft">{cls.description}</p>
              <ul data-reveal className="mt-8 flex flex-wrap gap-3">
                {[[Users, cls.ages], [MapPin, cls.room], [Clock, "Sundays 9:00 – 10:45 am"]].map(([Icon, label], i) => {
                  const I = Icon as typeof Users;
                  return <li key={i} className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-4 font-semibold shadow-card"><I className="h-4 w-4 text-brand-500" />{label as string}</li>;
                })}
              </ul>
            </div>
            {current && (
              <Link href={`/classes/${cls.id}/lessons/${current.id}/`} data-reveal className={clsx("group block rounded-5xl p-7 shadow-pop ring-[3px] ring-ink transition-transform hover:-translate-y-1", toneBg[group.tone], dark ? "text-white" : "text-ink")}>
                <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.1em] opacity-80"><BookOpen className="h-4 w-4" />Current lesson · {fmtDate(current.date, { day: "numeric", month: "short" })}</p>
                <p className="mt-3 font-display text-3xl font-bold leading-tight">{current.title}</p>
                <p className="mt-1 font-semibold opacity-80">{current.reference}</p>
                <div className={clsx("mt-5 rounded-3xl p-4", dark ? "bg-white/15" : "bg-white/60")}>
                  <p className="text-xs font-bold uppercase tracking-wider opacity-70">Memory verse</p>
                  <p className="mt-1 font-display text-lg font-semibold leading-snug">“{current.memoryVerse.text}” <span className="font-sans text-sm font-bold opacity-70">{current.memoryVerse.reference}</span></p>
                </div>
                <span className="mt-5 inline-flex items-center gap-2 font-display font-semibold">Open full lesson <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {current && (
        <section className="py-16 md:py-20" aria-labelledby="this-week">
          <div className="container grid grid-cols-1 gap-5 md:grid-cols-3">
            <h2 id="this-week" className="sr-only">This week at a glance</h2>
            {[["Lesson topic", current.topic], ["Lesson objective", current.objective], ["Bible verse", `${current.reference}`]].map(([k, v]) => (
              <div key={k} data-reveal className="rounded-4xl bg-white p-6 shadow-card ring-1 ring-ink/5">
                <p className="text-sm font-bold uppercase tracking-[0.08em] text-brand-600">{k}</p>
                <p className="mt-2 text-lg leading-relaxed text-ink">{v}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white py-16 md:py-24" aria-labelledby="teachers-title">
        <div className="container">
          <h2 id="teachers-title" data-reveal className="mb-8 font-display text-4xl font-bold tracking-tight">{teachers.length > 1 ? "Your teachers" : "Your teacher"}</h2>
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">{teachers.map((t) => <div key={t.id} data-reveal><TeacherCard teacher={t} classes={[cls]} /></div>)}</div>
        </div>
      </section>

      <section className="py-16 md:py-24" aria-labelledby="previous-title">
        <div className="container grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h2 id="previous-title" data-reveal className="font-display text-4xl font-bold tracking-tight">Previous lessons</h2>
            <p data-reveal className="mt-3 text-lg text-ink-mute">Missed a Sunday? Every lesson stays here with its story, questions and resources.</p>
            <ul className="mt-8 grid gap-3">
              {previous.map((l) => (
                <li key={l.id} data-reveal>
                  <Link href={`/classes/${cls.id}/lessons/${l.id}/`} className="group flex items-center gap-4 rounded-3xl bg-white p-4 shadow-card ring-1 ring-ink/5 transition-all hover:-translate-y-0.5 hover:shadow-lift">
                    <span className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-brand-50 text-brand-700"><span className="font-display text-lg font-bold leading-none">{new Date(l.date + "T12:00:00Z").getUTCDate()}</span><span className="text-[10px] font-bold uppercase">{fmtDate(l.date, { month: "short" })}</span></span>
                    <span className="min-w-0 flex-1"><span className="block font-display text-xl font-semibold">{l.title}</span><span className="text-ink-mute">{l.reference} · {l.topic}</span></span>
                    <ArrowRight className="h-5 w-5 shrink-0 text-ink-mute transition-transform group-hover:translate-x-1 group-hover:text-ink" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 data-reveal className="font-display text-4xl font-bold tracking-tight">Class gallery</h2>
            <p data-reveal className="mt-3 text-lg text-ink-mute">Group moments only — we never name or tag children.</p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              {gallery.slice(0, 3).map((g, i) => <div key={g.id} data-reveal="image" className={clsx("overflow-hidden rounded-4xl", i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square")}><MediaFrame media={g.media} /></div>)}
            </div>
            <div data-reveal className="mt-6"><Button href="/gallery/" variant="light">See the full gallery <ArrowRight className="h-4 w-4" /></Button></div>
          </div>
        </div>
      </section>
    </>
  );
}
