import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, CalendarDays } from "lucide-react";
import { Feed } from "@/components/Feed";
import { SocialLinks } from "@/components/SocialLinks";
import { SocialEmbeds } from "@/components/SocialEmbeds";
import { CmsHero } from "@/components/ui";
import { getCurrentLesson, getEvents, getHeroText, getSections, getSite, getSocialEmbeds } from "@/lib/content";
import { getLiveFeed } from "@/lib/cms/feed";
import { dayMonth } from "@/lib/format";

export const metadata: Metadata = {
  title: "Blog & Feed",
  description: "News, memory verses, photos and short videos from Children's Ministry teachers — a safe, moderated feed for families.",
  alternates: { canonical: "/blog/" },
};

export const revalidate = 30;

export default async function BlogPage() {
  const [{ posts, teachers }, events, site, lesson, embeds, hero, sec] = await Promise.all([getLiveFeed(), getEvents(), getSite(), getCurrentLesson("primary-2"), getSocialEmbeds(), getHeroText("blog"), getSections()]);
  const upcoming = events.filter((e) => (e.endDate || e.date) >= new Date().toISOString().slice(0, 10));

  const sidebar = (
    <div className="grid gap-5">
      {lesson && (
        <div className="rounded-4xl bg-ink p-6 text-white">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-sun-300"><BookOpen className="h-4 w-4" />Verse of the week</p>
          <p className="mt-3 font-display text-xl font-semibold leading-snug">“{lesson.memoryVerse.text}”</p>
          <p className="mt-2 text-sm font-bold text-white/60">{lesson.memoryVerse.reference}</p>
        </div>
      )}
      <div className="rounded-4xl bg-white p-6 ring-1 ring-ink/5">
        <p className="flex items-center gap-2 font-display text-lg font-semibold"><CalendarDays className="h-5 w-5 text-brand-500" />Coming up</p>
        <ul className="mt-4 grid gap-3">
          {upcoming.slice(0, 3).map((e) => {
            const d = dayMonth(e.date);
            return (
              <li key={e.id} className="flex gap-3">
                <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-50"><b className="font-display leading-none">{d.day}</b><span className="text-[10px] font-bold uppercase text-brand-600">{d.month}</span></span>
                <span><b className="block text-[15px] leading-snug">{e.title}</b><span className="text-sm text-ink-mute">{e.time}</span></span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="rounded-4xl bg-white p-6 ring-1 ring-ink/5">
        <p className="font-display text-lg font-semibold">Follow along</p>
        <div className="mt-4"><SocialLinks links={site.socials} /></div>
      </div>
      <p className="px-2 text-sm leading-relaxed text-ink-mute">This feed follows our <Link href="/safeguarding/" className="font-semibold underline">safeguarding policy</Link>: no child is named, tagged or shown without consent.</p>
    </div>
  );

  return (
    <>
    <CmsHero hero={hero} tone="coral" />
    <section className="bg-paper pb-20 pt-12 md:pt-16">
      <div className="container">
        <Feed initial={posts} teachers={teachers} sidebar={sidebar} />
        {embeds.length > 0 && (
          <div className="mt-20 border-t border-ink/10 pt-16">
            <div className="mb-8 max-w-2xl">
              <h2 data-split className="font-display text-[calc(var(--h-scale)*clamp(2rem,4vw,3rem))] font-bold leading-[1.05] tracking-tight">{sec("blog.social").title}</h2>
              {sec("blog.social").body && <p data-reveal className="mt-3 text-lg text-ink-mute">{sec("blog.social").body}</p>}
            </div>
            <SocialEmbeds items={embeds} />
          </div>
        )}
      </div>
    </section>
    </>
  );
}
