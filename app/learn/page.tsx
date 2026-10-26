import type { Metadata } from "next";
import { LearnHub } from "@/components/learn/LearnHub";
import { getLearn } from "@/lib/content";

export const metadata: Metadata = {
  title: "Bible games",
  description: "A fun Bible learning journey for children: quizzes, memory verses, Bible people and places, word puzzles, spelling, matching, story order and writing — with Pip the lamb, daily challenges, streaks and badges.",
  alternates: { canonical: "/learn/" },
};

export default async function LearnPage() {
  const { bank, lessons, categories, challenges } = await getLearn();
  return (
    <section aria-label="Bible games" className="bg-[linear-gradient(180deg,#EEF4FF_0%,#F7F5F0_420px)] pb-16 pt-24 md:pt-28">
      <div className="container">
        <header className="mb-4 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-extrabold uppercase tracking-[0.1em] text-brand-600 shadow-card">Learn &amp; play</p>
          <h1 className="mt-3 font-display text-[clamp(2.2rem,6vw,3.6rem)] font-extrabold leading-[1] tracking-tight">Bible games</h1>
          <p className="mx-auto mt-2 max-w-lg text-lg text-ink-soft">Five minutes a day with Pip the lamb. Grow from Seeds to Fruit!</p>
        </header>
        <LearnHub bank={bank} lessons={lessons} categories={categories} challenges={challenges} />
      </div>
    </section>
  );
}
