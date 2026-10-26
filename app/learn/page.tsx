import type { Metadata } from "next";
import { InteractiveHero } from "@/components/InteractiveHero";
import { LearnHub } from "@/components/learn/LearnHub";
import { getQuiz } from "@/lib/content";

export const metadata: Metadata = {
  title: "Bible games",
  description: "Fun, bite-sized Bible games for children: story quizzes, memory verses, Bible people and places, and writing practice — every question is new until you've tried them all.",
  alternates: { canonical: "/learn/" },
};

export default async function LearnPage() {
  const bank = await getQuiz();
  return (
    <>
      <InteractiveHero eyebrow="Learn & play" title="Bible games for curious kids" highlight="Bible games" tone="blue"
        body="Five minutes a day: quizzes, memory verses, Bible heroes and places. Earn stars and keep your streak going!" />
      <section className="pb-24 pt-6" aria-label="Choose a game">
        <div className="container"><LearnHub bank={bank} /></div>
      </section>
    </>
  );
}
