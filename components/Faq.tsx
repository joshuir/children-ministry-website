"use client";

import { useId, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { MessageCircle, Plus } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { MQ } from "@/lib/motion";
import { Button, Eyebrow } from "./ui";
import type { Faq as FaqItem, SectionText } from "@/lib/types";

const TOPICS: Record<string, string> = { visiting: "Visiting", classes: "Classes", safety: "Safety", parents: "Parents" };

/**
 * Editorial FAQ: sticky intro on the left, an accessible accordion on the right.
 * - Real <button>s with aria-expanded / aria-controls; answers are regions labelled by their question.
 * - GSAP opens/closes panels (height + opacity), the plus icon turns into a cross; instant for reduced motion.
 * - Topic chips filter the list; the list re-staggers in.
 * - Emits FAQPage structured data so answers can appear in search results.
 */
export function Faq({ items, text, contactHref = "/contact/", compact = false }: { items: FaqItem[]; text?: SectionText; contactHref?: string; compact?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const uid = useId();
  const topics = useMemo(() => Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[], [items]);
  const [topic, setTopic] = useState<string>("all");
  const shown = useMemo(() => (topic === "all" ? items : items.filter((i) => i.category === topic)), [items, topic]);
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  // Open/close choreography whenever the open item changes.
  useGSAP(() => {
    const reduce = matchMedia(MQ.reduce).matches;
    gsap.utils.toArray<HTMLElement>("[data-faq-panel]").forEach((panel) => {
      const isOpen = panel.dataset.faqPanel === open;
      const icon = root.current?.querySelector<HTMLElement>(`[data-faq-icon="${panel.dataset.faqPanel}"]`);
      const d = reduce ? 0 : 1;
      gsap.to(panel, { height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0, duration: (isOpen ? 0.55 : 0.4) * d, ease: isOpen ? "power3.out" : "power3.inOut", overwrite: true });
      if (icon) gsap.to(icon, { rotation: isOpen ? 45 : 0, duration: 0.45 * d, ease: "power3.out", overwrite: true });
    });
  }, { scope: root, dependencies: [open, shown] });

  // When the topic changes, the visible questions re-stagger in.
  useGSAP(() => {
    if (matchMedia(MQ.reduce).matches || topic === "all" && !root.current?.dataset.filtered) return;
    root.current!.dataset.filtered = "1";
    gsap.fromTo("[data-faq-item]", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out", stagger: 0.05, overwrite: true });
  }, { scope: root, dependencies: [topic] });

  if (!items.length) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };

  return (
    <div ref={root} className={clsx("grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16", compact && "lg:grid-cols-[0.7fr_1.3fr]")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="lg:sticky lg:top-28 lg:self-start" data-reveal>
        {text?.eyebrow && <Eyebrow tone="blue">{text.eyebrow}</Eyebrow>}
        <h2 id={`${uid}-title`} data-split className="mt-4 font-display text-[calc(var(--h-scale)*clamp(2rem,4.2vw,3.25rem))] font-bold leading-[1.04] tracking-[-0.02em] text-ink text-balance">{text?.title || "Questions parents ask"}</h2>
        {text?.body && <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-mute">{text.body}</p>}

        {topics.length > 1 && (
          <div role="group" aria-label="Filter questions by topic" className="mt-7 flex flex-wrap gap-2">
            {["all", ...topics].map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={topic === t}
                onClick={() => setTopic(t)}
                className={clsx(
                  "min-h-[40px] rounded-full px-4 text-sm font-bold transition-colors duration-300 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-500",
                  topic === t ? "bg-ink text-white" : "bg-white text-ink-soft ring-1 ring-ink/10 hover:ring-ink/30",
                )}
              >
                {t === "all" ? "All questions" : TOPICS[t] ?? t}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 hidden lg:block">
          <Button href={contactHref} variant="light">Ask us anything <MessageCircle className="h-4 w-4" /></Button>
        </div>
      </div>

      <ul aria-labelledby={`${uid}-title`} className="divide-y divide-ink/[0.08] border-y border-ink/[0.08]">
        {shown.map((f) => {
          const isOpen = open === f.id;
          const panelId = `${uid}-${f.id}-panel`, btnId = `${uid}-${f.id}-btn`;
          return (
            <li key={f.id} data-faq-item>
              <h3>
                <button
                  id={btnId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpen(isOpen ? null : f.id)}
                  className="group flex w-full items-start justify-between gap-6 py-6 text-left focus-visible:outline-none"
                >
                  <span className={clsx("font-display text-xl font-semibold leading-snug tracking-tight transition-colors duration-300 md:text-[1.4rem]", isOpen ? "text-ink" : "text-ink-soft group-hover:text-ink")}>
                    <span className="rounded-md group-focus-visible:outline group-focus-visible:outline-[3px] group-focus-visible:outline-offset-4 group-focus-visible:outline-brand-500">{f.question}</span>
                  </span>
                  <span aria-hidden className={clsx("mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors duration-300", isOpen ? "bg-brand-500 text-white" : "bg-ink/[0.05] text-ink group-hover:bg-ink group-hover:text-white")}>
                    <span data-faq-icon={f.id} className="flex"><Plus className="h-5 w-5" /></span>
                  </span>
                </button>
              </h3>
              <div
                id={panelId}
                role="region"
                aria-labelledby={btnId}
                aria-hidden={!isOpen}
                data-faq-panel={f.id}
                className="overflow-hidden"
                style={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
              >
                <p className="max-w-2xl pb-7 pr-14 text-lg leading-relaxed text-ink-mute">{f.answer}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="lg:hidden">
        <Button href={contactHref} variant="light">Ask us anything <MessageCircle className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
