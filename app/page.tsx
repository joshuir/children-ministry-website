import Link from "next/link";
import clsx from "clsx";
import { ArrowRight, ArrowUpRight, BookOpen, Check } from "lucide-react";
import { Hero } from "@/components/Hero";
import { WelcomeStats } from "@/components/WelcomeStats";
import { Button, MediaFrame, SectionHeader } from "@/components/ui";
import { Scene } from "@/components/Scene";
import { EventsCalendar } from "@/components/EventsCalendar";
import { SocialGrid } from "@/components/SocialGrid";
import { TeamShowcase } from "@/components/TeamShowcase";
import { PostPreview } from "@/components/PostPreview";
import { AppDownload } from "@/components/AppDownload";
import { Newsletter } from "@/components/Newsletter";
import { toneBg, toneSoft } from "@/components/ClassCard";
import { getClasses, getCurrentLesson, getEvents, getFaqs, getGallery, getGalleryCategories, getGroups, getHome, getPages, getPosts, getSections, getSite, getTeachers } from "@/lib/content";
import { Faq } from "@/components/Faq";
import { fmtDate } from "@/lib/format";
import { LessonMedia } from "@/components/BibleLesson";

export default async function HomePage() {
  const [site, home, groups, classes, events, posts, teachers, gallery, cats, sec, pages, faqs] = await Promise.all([
    getSite(), getHome(), getGroups(), getClasses(), getEvents(), getPosts(), getTeachers(), getGallery(), getGalleryCategories(), getSections(), getPages(), getFaqs(),
  ]);
  const nl = pages.newsletter;
  const featuredClass = classes.find((c) => c.id === "primary-2") ?? classes[0];
  const lesson = await getCurrentLesson(featuredClass.id);
  const byId = Object.fromEntries(teachers.map((t) => [t.id, t]));
  const catLabel = Object.fromEntries(cats.map((c) => [c.id, c.label]));

  return (
    <>
      <Hero hero={home.hero} site={site} lesson={lesson && { title: lesson.title, reference: lesson.reference, verse: lesson.memoryVerse.text }} />

      {/* 1. Welcome */}
      <section className="py-20 md:py-28" aria-labelledby="welcome-title">
        <WelcomeStats welcome={home.welcome} stats={home.stats} />
      </section>

      {/* 2. About the children's service */}
      <section className="bg-white py-20 md:py-28" aria-labelledby="about-title">
        <div className="container grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div data-reveal="image" className="relative order-2 aspect-[4/3.4] overflow-hidden rounded-5xl lg:order-1">
            <MediaFrame media={home.about.image} />
          </div>
          <div className="order-1 lg:order-2">
            <SectionHeader id="about-title" eyebrow={sec("home.about").eyebrow} tone="sun" title={home.about.title} body={home.about.body} />
            <ul data-card-group className="-mt-4 grid gap-3 sm:grid-cols-2">
              {home.about.points.map((p, i) => (
                <li key={p.title} data-reveal data-card className="flex gap-3 rounded-3xl bg-paper p-5 ring-1 ring-ink/[0.05] transition-colors duration-300 hover:bg-white">
                  <span data-pop className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", ["bg-brand-500 text-white", "bg-sun-400", "bg-coral-400 text-white", "bg-mint-400"][i])}><Check className="h-5 w-5" strokeWidth={3} /></span>
                  <span><b className="block font-display text-lg font-semibold">{p.title}</b><span className="text-ink-mute">{p.body}</span></span>
                </li>
              ))}
            </ul>
            <div data-reveal className="mt-8"><Button href="/about/" variant="dark">More about us <ArrowRight className="h-4 w-4" /></Button></div>
          </div>
        </div>
      </section>

      {/* 3. Class categories */}
      <section className="py-20 md:py-28" aria-labelledby="classes-title">
        <div className="container">
          <SectionHeader id="classes-title" eyebrow={sec("home.classes").eyebrow} title={sec("home.classes").title} body={sec("home.classes").body} action={<Button href="/classes/" variant="light">All classes <ArrowRight className="h-4 w-4" /></Button>} />
          <div data-card-group className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {groups.map((g) => {
              const n = classes.filter((c) => c.group === g.id).length;
              const darkText = g.tone === "sun" || g.tone === "mint";
              return (
                <Link key={g.id} href={`/classes/#${g.id}`} data-reveal data-card data-cursor="Explore" className="group flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-card ring-1 ring-ink/[0.07]">
                  <div data-card-media className={clsx("relative aspect-[4/3]", toneSoft[g.tone])}>
                    <Scene scene={g.scene} tone={g.tone} className="h-full w-full" />
                    <span data-pop className={clsx("absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em]", toneBg[g.tone], darkText ? "text-ink" : "text-white")}>{g.ages}</span>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-3xl font-bold tracking-tight text-ink">{g.name}</h3>
                      <span data-card-arrow aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink/[0.05] text-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-white"><ArrowUpRight className="h-5 w-5" /></span>
                    </div>
                    <p className="mt-2 flex-1 leading-relaxed text-ink-mute">{g.blurb}</p>
                    <p className="mt-5 border-t border-ink/[0.07] pt-4 text-sm font-bold text-ink-soft">{n} classes</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Upcoming events */}
      <section className="bg-white py-20 md:py-28" aria-labelledby="events-title">
        <div className="container">
          <SectionHeader id="events-title" eyebrow={sec("home.events").eyebrow} tone="coral" title={sec("home.events").title} body={sec("home.events").body} action={<Button href="/events/" variant="light">Events calendar <ArrowRight className="h-4 w-4" /></Button>} />
          <EventsCalendar events={events} address={site.contact.address.join(", ")} mode="mini" initialMonth={new Date().toISOString().slice(0, 7)} calendarName={site.shortName} />
        </div>
      </section>

      {/* 5. Featured Bible lesson */}
      {lesson && (
        <section className="relative overflow-hidden bg-ink py-20 text-white md:py-28" aria-labelledby="lesson-title">
          <div aria-hidden className="absolute -left-40 top-10 h-[420px] w-[420px] rounded-full" style={{ background: "radial-gradient(circle, rgba(37,99,235,.35) 0%, transparent 68%)" }} />
          <div className="container relative grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p data-reveal className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-sun-300"><BookOpen className="h-4 w-4" />{sec("home.lesson").eyebrow || "Featured Bible lesson"} · {fmtDate(lesson.date, { day: "numeric", month: "long" })}</p>
              <h2 id="lesson-title" data-reveal className="mt-6 font-display text-[calc(var(--h-scale)*clamp(2.5rem,6vw,4.5rem))] font-bold leading-[0.98] tracking-[-0.03em]">{lesson.title}</h2>
              <p data-reveal className="mt-3 text-xl font-semibold text-white/60">{lesson.reference} · {lesson.topic}</p>
              {sec("home.lesson").body && <p data-reveal className="mt-6 max-w-xl text-lg leading-relaxed text-white/80">{sec("home.lesson").body}</p>}
              <div data-reveal className="mt-8 flex flex-wrap gap-3">
                <Button href={`/classes/${featuredClass.id}/lessons/${lesson.id}/`} variant="sun" size="lg">Read the lesson <ArrowRight className="h-5 w-5" /></Button>
                <Button href="/classes/" variant="ghost" size="lg" className="!text-white hover:!bg-white/10">Choose your child&apos;s class</Button>
              </div>
            </div>
            <div className="grid gap-5">
            {lesson.media?.src && <LessonMedia media={lesson.media} />}
            <figure data-reveal data-card className="relative rounded-5xl bg-white p-8 text-ink shadow-[10px_10px_0_0_#FFC53D] md:p-12">
              <p className="text-sm font-bold uppercase tracking-[0.1em] text-brand-600">Memory verse</p>
              <blockquote className="mt-4 font-display text-[calc(var(--h-scale)*clamp(1.75rem,3.4vw,2.5rem))] font-semibold leading-[1.12] tracking-tight">“{lesson.memoryVerse.text}”</blockquote>
              <figcaption className="mt-6 flex items-center justify-between gap-4 border-t border-ink/10 pt-5">
                <span className="font-bold">{lesson.memoryVerse.reference}</span>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">{featuredClass.name} version</span>
              </figcaption>
            </figure>
            </div>
          </div>
        </section>
      )}

      {/* 6. Latest posts */}
      <section className="py-20 md:py-28" aria-labelledby="posts-title">
        <div className="container">
          <SectionHeader id="posts-title" eyebrow={sec("home.posts").eyebrow} title={sec("home.posts").title} body={sec("home.posts").body} action={<Button href="/blog/" variant="light">Open the feed <ArrowRight className="h-4 w-4" /></Button>} />
          <div data-card-group className="grid gap-5 md:grid-cols-3">{posts.slice(0, 3).map((p) => <PostPreview key={p.id} post={p} author={byId[p.authorId]} />)}</div>
        </div>
      </section>

      {/* 7. Gallery preview */}
      <section className="bg-white py-20 md:py-28" aria-labelledby="gallery-title">
        <div className="container">
          <SectionHeader id="gallery-title" eyebrow={sec("home.gallery").eyebrow} tone="mint" title={sec("home.gallery").title} body={sec("home.gallery").body} action={<Button href="/gallery/" variant="light">View gallery <ArrowRight className="h-4 w-4" /></Button>} />
          <div data-card-group className="grid auto-rows-[180px] grid-cols-2 gap-4 md:auto-rows-[220px] md:grid-cols-4">
            {gallery.slice(0, 4).map((g, i) => (
              <Link key={g.id} href="/gallery/" data-reveal data-card data-cursor="View" className={clsx("group relative overflow-hidden rounded-4xl", i === 0 && "col-span-2 row-span-2", i === 3 && "md:col-span-2")}>
                <div data-card-media className="absolute inset-0"><div className="h-full w-full"><MediaFrame media={g.media} /></div></div>
                <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/90 px-4 py-2.5 backdrop-blur transition-transform duration-300 md:translate-y-[140%] md:group-hover:translate-y-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-600">{catLabel[g.category]}</p>
                  <p className="truncate font-display font-semibold text-ink">{g.event}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Teachers preview */}
      <section className="bg-white py-20 md:py-28" aria-labelledby="teachers-title">
        <div className="container">
          <span id="teachers-title" className="sr-only">Our teachers</span>
          <TeamShowcase teachers={teachers} classes={classes} groups={groups} text={sec("home.teachers")} limit={5} cta={{ href: "/about/#teachers", label: "Meet the team" }} />
        </div>
      </section>

      {/* 9. App */}
      <section className="pb-20 md:pb-28" aria-label="Mobile app">
        <div className="container"><AppDownload app={site.app} title={sec("home.app").title} eyebrow={sec("home.app").eyebrow} /></div>
      </section>

      {/* 10. Social — Follow our journey */}
      <section className="bg-white py-20 md:py-28" aria-labelledby="social-title">
        <div className="container">
          <SectionHeader id="social-title" eyebrow={sec("home.social").eyebrow} align="center" title={sec("home.social").title} body={sec("home.social").body} />
          <SocialGrid links={site.socials} />
        </div>
      </section>

      {/* 11. FAQs */}
      {faqs.length > 0 && (
        <section className="bg-paper py-20 md:py-28" aria-label="Frequently asked questions">
          <div className="container"><Faq items={faqs} text={sec("home.faq")} /></div>
        </section>
      )}

      {/* 12. Newsletter */}
      <section className="py-20 md:py-28" aria-labelledby="newsletter-title">
        <div className="container">
          <div className="relative overflow-hidden rounded-5xl bg-brand-500 px-6 py-12 text-white md:px-14 md:py-16">
            <svg aria-hidden viewBox="0 0 200 200" className="absolute -right-16 -top-16 w-72 text-brand-400"><circle cx="100" cy="100" r="100" fill="currentColor" /></svg>
            <svg aria-hidden viewBox="0 0 20 20" className="float-shape absolute left-[46%] top-10 hidden w-8 lg:block"><path d="M10 0C11.5 8 12 8.5 20 10C12 11.5 11.5 12 10 20C8.5 12 8 11.5 0 10C8 8.5 8.5 8 10 0Z" fill="#FFC53D" /></svg>
            <div className="relative grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
              <div>
                <h2 id="newsletter-title" data-reveal className="font-display text-[calc(var(--h-scale)*clamp(2rem,4vw,3rem))] font-bold leading-[1.05] tracking-tight">{nl.title}</h2>
                <p data-reveal className="mt-4 max-w-md text-lg text-white/80">{nl.body}</p>
              </div>
              <div data-reveal><Newsletter thanks={nl.thanks} button={nl.button} /></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
