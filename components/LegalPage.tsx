import { PageHero } from "./ui";
import type { Tone } from "@/lib/types";

export function LegalPage({ eyebrow, title, intro, updated, sections, tone = "blue" }: { eyebrow: string; title: string; intro: string; updated: string; tone?: Tone; sections: { h: string; p: (string | string[])[] }[] }) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} body={intro} tone={tone} />
      <section className="py-14 md:py-20">
        <div className="container grid grid-cols-1 gap-10 lg:grid-cols-[240px_1fr]">
          <nav aria-label="Sections" className="hidden lg:block">
            <ol className="sticky top-28 grid gap-1 text-[15px]">
              {sections.map((s, i) => <li key={s.h}><a href={`#s${i}`} className="flex min-h-[40px] items-center rounded-xl px-3 font-semibold text-ink-mute hover:bg-white hover:text-ink">{s.h}</a></li>)}
            </ol>
          </nav>
          <article className="max-w-3xl rounded-4xl bg-white p-6 shadow-card ring-1 ring-ink/5 md:p-12">
            <p className="text-sm font-semibold text-ink-mute">Last updated {updated}</p>
            {sections.map((s, i) => (
              <section key={s.h} id={`s${i}`} className="scroll-mt-28 border-b border-ink/5 py-8 last:border-0 last:pb-0">
                <h2 className="font-display text-2xl font-semibold tracking-tight">{s.h}</h2>
                {s.p.map((para, j) => Array.isArray(para)
                  ? <ul key={j} className="mt-4 grid gap-2">{para.map((li) => <li key={li} className="flex gap-3 text-[17px] leading-relaxed text-ink-soft"><span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />{li}</li>)}</ul>
                  : <p key={j} className="mt-4 text-[17px] leading-relaxed text-ink-soft">{para}</p>)}
              </section>
            ))}
          </article>
        </div>
      </section>
    </>
  );
}
