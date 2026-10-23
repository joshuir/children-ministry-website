import type { Metadata } from "next";
import clsx from "clsx";
import { CmsHero } from "@/components/ui";
import { ClassCard, toneBg, toneSoft } from "@/components/ClassCard";
import { Scene } from "@/components/Scene";
import { getClasses, getCurrentLesson, getGroups, getHeroText, getTeachers } from "@/lib/content";

export const metadata: Metadata = {
  title: "Classes",
  description: "Beginners, Primary, Juniors and Seniors — nine age-based Sunday classes for children aged 3 to 13, each with its own weekly Bible lesson.",
  alternates: { canonical: "/classes/" },
};

export default async function ClassesPage() {
  const [groups, classes, teachers, hero] = await Promise.all([getGroups(), getClasses(), getTeachers(), getHeroText("classes")]);
  const lessons = Object.fromEntries(await Promise.all(classes.map(async (c) => [c.id, await getCurrentLesson(c.id)] as const)));
  const tFor = (ids: string[]) => teachers.filter((t) => ids.includes(t.id));

  return (
    <>
      <CmsHero hero={hero} tone="blue" />

      <nav aria-label="Class groups" className="sticky top-[76px] z-30 border-b border-ink/5 bg-paper/90 backdrop-blur-xl md:top-[84px]">
        <div className="container scrollbar-none flex gap-2 overflow-x-auto py-3">
          {groups.map((g) => (
            <a key={g.id} href={`#${g.id}`} className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full bg-white px-4 text-[15px] font-semibold ring-1 ring-ink/10 transition-all hover:-translate-y-0.5 hover:ring-ink/30">
              <span className={clsx("h-2.5 w-2.5 rounded-full", toneBg[g.tone])} />{g.name}<span className="text-sm text-ink-mute">{g.ages}</span>
            </a>
          ))}
        </div>
      </nav>

      {groups.map((g, gi) => (
        <section key={g.id} id={g.id} className={clsx("scroll-mt-40 py-16 md:py-24", gi % 2 === 1 && "bg-white")} aria-labelledby={`${g.id}-title`}>
          <div className="container">
            <div className="mb-10 grid items-center gap-8 md:grid-cols-[1fr_320px]">
              <div data-reveal>
                <span className={clsx("inline-flex rounded-full px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em]", toneSoft[g.tone])}>{g.ages}</span>
                <h2 id={`${g.id}-title`} className="mt-4 font-display text-[calc(var(--h-scale)*clamp(2.5rem,5vw,4rem))] font-bold leading-none tracking-[-0.03em]">{g.name}</h2>
                <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-mute">{g.blurb}</p>
              </div>
              <div data-reveal="image" className="hidden aspect-[16/11] overflow-hidden rounded-4xl md:block"><Scene scene={g.scene} tone={g.tone} className="h-full w-full" /></div>
            </div>
            <div data-card-group className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {classes.filter((c) => c.group === g.id).map((c) => <ClassCard key={c.id} cls={c} tone={g.tone} teachers={tFor(c.teacherIds)} lesson={lessons[c.id]} />)}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
