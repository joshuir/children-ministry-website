import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ChevronRight, Printer } from "lucide-react";
import { BibleLesson } from "@/components/BibleLesson";
import { Decor } from "@/components/ui";
import { getClass, getClasses, getLesson, getLessonsFor } from "@/lib/content";
import { fmtDate } from "@/lib/format";

export async function generateStaticParams() {
  const classes = await getClasses();
  const all = await Promise.all(classes.map(async (c) => (await getLessonsFor(c.id)).map((l) => ({ slug: c.id, lesson: l.id }))));
  return all.flat();
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; lesson: string }> }): Promise<Metadata> {
  const { slug, lesson: id } = await params;
  const [c, l] = await Promise.all([getClass(slug), getLesson(slug, id)]);
  if (!c || !l) return {};
  return { title: `${l.title} — ${c.name}`, description: `${l.reference}: ${l.objective}`, alternates: { canonical: `/classes/${c.id}/lessons/${l.id}/` } };
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lesson: string }> }) {
  const { slug, lesson: id } = await params;
  const [cls, lesson, all] = await Promise.all([getClass(slug), getLesson(slug, id), getLessonsFor(slug)]);
  if (!cls || !lesson) notFound();
  const idx = all.findIndex((l) => l.id === lesson.id);
  const newer = all[idx - 1];
  const older = all[idx + 1];
  const jsonLd = { "@context": "https://schema.org", "@type": "LearningResource", name: lesson.title, educationalLevel: cls.ages, about: lesson.reference, teaches: lesson.objective, inLanguage: "en-GB" };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="relative overflow-hidden bg-brand-50 pb-14 pt-32 md:pt-40">
        <Decor />
        <div className="container relative">
          <nav aria-label="Breadcrumb" data-reveal className="mb-6 flex flex-wrap items-center gap-1 text-sm font-semibold text-ink-mute">
            <Link href="/classes/" className="hover:text-ink">Classes</Link><ChevronRight className="h-4 w-4" />
            <Link href={`/classes/${cls.id}/`} className="hover:text-ink">{cls.name}</Link><ChevronRight className="h-4 w-4" />
            <span aria-current="page" className="text-ink">{lesson.title}</span>
          </nav>
          <p data-reveal className="font-semibold text-brand-600">{cls.name} · {fmtDate(lesson.date)}</p>
          <h1 data-reveal className="mt-2 font-display text-[calc(var(--h-scale)*clamp(2.75rem,7vw,5.25rem))] font-extrabold leading-[0.95] tracking-[-0.035em]">{lesson.title}</h1>
          <div data-reveal className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex min-h-[44px] items-center rounded-full bg-ink px-5 font-bold text-white">{lesson.reference}</span>
            <span className="inline-flex min-h-[44px] items-center rounded-full bg-white px-5 font-semibold ring-1 ring-ink/10">{lesson.topic}</span>
            <a href="#resources" className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-5 font-semibold ring-1 ring-ink/10 hover:ring-ink/30"><Printer className="h-4 w-4" />Printable sheet</a>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          <BibleLesson lesson={lesson} />
          <nav aria-label="More lessons" className="mt-12 grid gap-4 sm:grid-cols-2 lg:ml-[272px]">
            {older ? (
              <Link href={`/classes/${cls.id}/lessons/${older.id}/`} className="group flex items-center gap-4 rounded-3xl bg-white p-5 shadow-card ring-1 ring-ink/5 hover:shadow-lift">
                <ArrowLeft className="h-5 w-5 text-ink-mute transition-transform group-hover:-translate-x-1" />
                <span><span className="text-sm font-bold text-ink-mute">Previous lesson</span><span className="block font-display text-lg font-semibold">{older.title}</span></span>
              </Link>
            ) : <span />}
            {newer && (
              <Link href={`/classes/${cls.id}/lessons/${newer.id}/`} className="group flex items-center justify-end gap-4 rounded-3xl bg-white p-5 text-right shadow-card ring-1 ring-ink/5 hover:shadow-lift">
                <span><span className="text-sm font-bold text-ink-mute">Next lesson</span><span className="block font-display text-lg font-semibold">{newer.title}</span></span>
                <ArrowRight className="h-5 w-5 text-ink-mute transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </nav>
        </div>
      </section>
    </>
  );
}
