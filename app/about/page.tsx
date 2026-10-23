import type { Metadata } from "next";
import clsx from "clsx";
import { Download, Eye, FileText, Rocket } from "lucide-react";
import { CmsHero, MediaFrame, SectionHeader } from "@/components/ui";
import { TeamShowcase } from "@/components/TeamShowcase";
import { AppDownload } from "@/components/AppDownload";
import { getAbout, getClasses, getGroups, getHeroText, getSections, getSite, getTeachers } from "@/lib/content";

export const metadata: Metadata = {
  title: "About Us",
  description: "Meet the teachers of Presbyterian Children's Ministry, read our story since 2006, and discover the vision and mission behind our Sunday classes.",
  alternates: { canonical: "/about/" },
};

export default async function AboutPage() {
  const [{ history, vision, mission, historyDoc }, teachers, site, classes, groups, hero, sec] = await Promise.all([getAbout(), getTeachers(), getSite(), getClasses(), getGroups(), getHeroText("about"), getSections()]);
  const pillarTone = ["bg-brand-500 text-white", "bg-sun-400 text-ink", "bg-coral-400 text-white", "bg-mint-400 text-ink"];

  return (
    <>
      <CmsHero hero={hero} tone="blue">
        <nav aria-label="On this page" className="flex flex-wrap gap-2">
          {[["#vision", "Vision & mission"], ["#teachers", "Teachers"], ["#history", "Our history"], ["#app", "Mobile app"]].map(([h, l]) => (
            <a key={h} href={h} className="inline-flex min-h-[44px] items-center rounded-full bg-white px-4 text-[15px] font-semibold text-ink ring-1 ring-ink/10 transition-all hover:-translate-y-0.5 hover:ring-ink/30">{l}</a>
          ))}
        </nav>
      </CmsHero>

      {/* Vision & mission */}
      <section id="vision" className="scroll-mt-24 py-20 md:py-28" aria-labelledby="vision-title">
        <div className="container grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.25fr]">
          <div data-reveal className="relative flex flex-col justify-between overflow-hidden rounded-5xl bg-ink p-8 text-white md:p-12">
            <svg aria-hidden viewBox="0 0 200 200" className="absolute -right-14 -top-14 w-56 opacity-90"><circle cx="100" cy="100" r="60" fill="#FFC53D" />{[...Array(12)].map((_, i) => { const a = (i / 12) * Math.PI * 2; return <path key={i} d={`M${100 + Math.cos(a) * 74} ${100 + Math.sin(a) * 74} L${100 + Math.cos(a) * 94} ${100 + Math.sin(a) * 94}`} stroke="#FFC53D" strokeWidth="8" strokeLinecap="round" />; })}</svg>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><Eye className="h-7 w-7 text-sun-300" /></span>
            <div className="relative mt-16 max-w-md">
              <h2 id="vision-title" className="text-sm font-bold uppercase tracking-[0.12em] text-sun-300">{vision.title}</h2>
              <p data-fill className="mt-4 font-display text-[calc(var(--h-scale)*clamp(1.75rem,3.4vw,2.6rem))] font-semibold leading-[1.1] tracking-tight">{vision.statement}</p>
            </div>
          </div>
          <div id="mission" data-reveal className="scroll-mt-24 rounded-5xl bg-white p-8 shadow-card ring-1 ring-ink/5 md:p-12">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50"><Rocket className="h-7 w-7 text-brand-500" /></span>
            <h2 className="mt-8 text-sm font-bold uppercase tracking-[0.12em] text-brand-600">{mission.title}</h2>
            <p className="mt-2 text-lg text-ink-soft">{mission.intro}</p>
            <ol className="mt-6 grid gap-4 sm:grid-cols-2">
              {mission.pillars.map((p, i) => (
                <li key={p.title} className="rounded-3xl bg-paper p-5">
                  <span className={clsx("flex h-9 w-9 items-center justify-center rounded-full font-display font-bold", pillarTone[i])}>{i + 1}</span>
                  <h3 className="mt-3 font-display text-xl font-semibold">{p.title}</h3>
                  <p className="mt-1 leading-relaxed text-ink-mute">{p.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Teachers */}
      <section id="teachers" className="scroll-mt-24 bg-white py-20 md:py-28" aria-labelledby="teachers-title">
        <div className="container">
          <span id="teachers-title" className="sr-only">Our teachers</span>
          <TeamShowcase teachers={teachers} classes={classes} groups={groups} text={sec("about.teachers")} />
        </div>
      </section>

      {/* History timeline */}
      <section id="history" className="scroll-mt-24 py-20 md:py-28" aria-labelledby="history-title">
        <div className="container">
          <SectionHeader id="history-title" eyebrow={sec("about.history").eyebrow} tone="sun" align="center" title={sec("about.history").title} body={sec("about.history").body} />
          {historyDoc?.url && (
            <a data-reveal href={historyDoc.url} download target="_blank" rel="noopener noreferrer" data-card className="group mx-auto -mt-4 mb-14 flex max-w-xl items-center gap-4 rounded-4xl bg-ink p-4 pr-5 text-white shadow-lift transition-transform hover:-translate-y-1 sm:p-5">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sun-400 text-ink transition-transform duration-300 group-hover:-rotate-6"><FileText className="h-7 w-7" /></span>
              <span className="min-w-0 flex-1">
                <b className="block font-display text-lg leading-tight">{historyDoc.label || "Download our full history"}</b>
                {historyDoc.note && <span className="block truncate text-sm font-semibold text-white/60">{historyDoc.note}</span>}
              </span>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-transform duration-300 group-hover:translate-y-0.5"><Download className="h-5 w-5" /></span>
            </a>
          )}
          <ol className="relative mx-auto max-w-5xl">
            <span aria-hidden className="absolute bottom-6 left-[27px] top-6 w-1 rounded-full bg-gradient-to-b from-brand-500 via-sun-400 to-coral-400 md:left-1/2 md:-translate-x-1/2" />
            {history.map((h, i) => (
              <li key={h.year} className="relative grid gap-6 pb-12 pl-20 last:pb-0 md:grid-cols-2 md:gap-16 md:pl-0">
                <span aria-hidden className="absolute left-0 top-0 flex h-14 w-14 items-center justify-center rounded-full border-4 border-paper bg-ink font-display text-sm font-bold text-white md:left-1/2 md:-translate-x-1/2">{h.year.slice(2)}’</span>
                <div data-reveal className={clsx("md:pt-1", i % 2 ? "md:order-2" : "md:text-right")}>
                  <p className="font-display text-5xl font-extrabold tracking-tight text-brand-500">{h.year}</p>
                  <h3 className="mt-2 font-display text-2xl font-semibold">{h.title}</h3>
                  <p className={clsx("mt-2 max-w-md leading-relaxed text-ink-mute", i % 2 ? "" : "md:ml-auto")}>{h.body}</p>
                </div>
                <div data-reveal="image" className={clsx("aspect-[16/10] overflow-hidden rounded-4xl shadow-card", i % 2 && "md:order-1")}>
                  <MediaFrame media={h.image} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="app" className="scroll-mt-24 pb-20 md:pb-28" aria-label="Mobile app">
        <div className="container"><AppDownload app={site.app} /></div>
      </section>
    </>
  );
}
