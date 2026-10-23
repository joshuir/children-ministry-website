"use client";

import { useRef } from "react";
import { gsap, useGSAP, whileVisible } from "@/lib/gsap";
import { MQ, heroIntro, heroMouseInteraction, heroScroll, intensity, type Tier } from "@/lib/motion";
import { ArrowRight, BookOpen, Heart, Users } from "lucide-react";
import { Button } from "./ui";
import { Scene } from "./Scene";
import { whenIntroDone } from "./Intro";
import type { HomeContent, SiteSettings } from "@/lib/types";

const typeTones = ["#2563EB", "#FF7A59", "#1E3A8A", "#E9A100", "#4FA8FF"];

/** Pull the rotating words out of older headlines ("Helping Children Know, Love and" + "Live God's Word"). */
function shapeHeadline(hero: HomeContent["hero"]) {
  const rotate = (hero.rotate || []).map((w) => w.trim()).filter(Boolean);
  if (!rotate.length) return { lead: hero.headline, rotate, tail: hero.highlight };
  const isRot = (w: string) => rotate.some((r) => r.toLowerCase() === w.replace(/[,.;:!]/g, "").toLowerCase()) || /^(and|&|,)$/i.test(w);
  const lead = hero.headline.split(/\s+/).filter(Boolean);
  while (lead.length && isRot(lead[lead.length - 1])) lead.pop();
  const tail = hero.highlight.split(/\s+/).filter(Boolean);
  while (tail.length && isRot(tail[0])) tail.shift();
  return { lead: lead.join(" "), rotate, tail: tail.join(" ") };
}

export function Hero({ hero, site, lesson }: { hero: HomeContent["hero"]; site: SiteSettings; lesson?: { title: string; reference: string; verse: string } }) {
  const root = useRef<HTMLElement>(null);

  useGSAP(() => {
    const el = root.current!;
    const mm = gsap.matchMedia();
    mm.add({ desktop: MQ.desktop, tablet: MQ.tablet, mobile: MQ.mobile, reduce: MQ.reduce }, (ctx) => {
      const t = ctx.conditions as Tier;
      const k = intensity(t);
      if (t.reduce) return; // content is fully visible; no motion at all

      // 1. Cinematic entrance: visual → headline → copy → CTAs → details, then the write-on loop begins.
      const intro = heroIntro(el);
      const loop = typeLoop(el);
      if (loop) intro.call(() => loop.start(), undefined, ">-0.2");
      const off = whenIntroDone(() => intro.play());

      // 2. Pointer depth (desktop full strength, tablet softer, phones none).
      const stopMouse = t.mobile ? () => {} : heroMouseInteraction(el, k);

      // 3. Scroll transformation into the next section.
      heroScroll(el, t.mobile ? 0.5 : 1);

      return () => { off(); stopMouse(); loop?.kill(); };
    });
  }, { scope: root });

  const { lead, rotate, tail } = shapeHeadline(hero);
  const words = lead.split(" ").filter(Boolean);
  const still = rotate.length ? rotate.length > 1 ? `${rotate.slice(0, -1).join(", ")} and ${rotate[rotate.length - 1]}` : rotate[0] : "";

  return (
    <section ref={root} className="relative overflow-hidden bg-brand-50 pb-16 pt-28 md:pb-24 md:pt-36" aria-labelledby="hero-title">
      {/* background layers — drift away from the cursor */}
      <div aria-hidden data-hero="bg" className="pointer-events-none absolute inset-0 origin-top">
        <div data-depth="-14" className="absolute inset-0">
          <svg className="absolute inset-0 h-full w-full opacity-[0.5]"><defs><pattern id="hero-dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="#B9CEFF" /></pattern></defs><rect width="100%" height="100%" fill="url(#hero-dots)" /></svg>
        </div>
        <div data-depth="-26" className="absolute -right-32 top-10 h-[480px] w-[480px] rounded-full bg-brand-100 blur-2xl" />
      </div>
      {/* decorative shapes — each on its own depth and scroll speed */}
      <div aria-hidden data-depth="-34" className="pointer-events-none absolute left-[4%] top-[18%] hidden md:block">
        <div data-hero-scroll="deco"><svg data-hero="deco" className="w-10" viewBox="0 0 20 20"><path d="M10 0C11.5 8 12 8.5 20 10C12 11.5 11.5 12 10 20C8.5 12 8 11.5 0 10C8 8.5 8.5 8 10 0Z" fill="#FFC53D" /></svg></div>
      </div>
      <div aria-hidden data-depth="22" className="pointer-events-none absolute bottom-[12%] left-[46%] hidden md:block">
        <div data-hero-scroll="deco"><div data-hero="deco" className="h-6 w-6 rounded-full border-4 border-coral-400" /></div>
      </div>

      <div className="container relative grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
        <div data-hero-scroll="content">
          <p data-hero="secondary" className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-ink shadow-card">
            <span className="h-2.5 w-2.5 rounded-full bg-mint-400" />
            {hero.eyebrow}
          </p>
          <h1 id="hero-title" className="font-display text-[calc(var(--h-scale)*clamp(2.75rem,7.2vw,5.6rem))] font-extrabold leading-[0.95] tracking-[-0.035em] text-ink">
            <span className="sr-only">{[lead, still, tail].filter(Boolean).join(" ")}</span>
            <span aria-hidden>
              {words.map((w, i) => <span key={i}><span className="inline-block overflow-hidden pb-[0.08em] align-bottom"><span data-hero="word" className="inline-block">{w}</span></span>{" "}</span>)}
              {rotate.length > 0 && (
                <span className="block">
                  <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                    <span data-hero="word" className="inline-flex items-baseline">
                      <span className="hero-type motion-reduce:hidden" data-words={rotate.join("|")} style={{ color: typeTones[0] }}>{rotate[0]}</span>
                      <span className="hidden text-brand-500 motion-reduce:inline">{still}</span>
                      <span className="hero-caret motion-reduce:hidden" style={{ background: typeTones[0] }} />
                    </span>
                  </span>
                </span>
              )}
              {tail.split(" ").filter(Boolean).map((w, i, arr) => <span key={`h${i}`}><span className="inline-block overflow-hidden pb-[0.14em] align-bottom"><span data-hero="word" className="squiggle inline-block text-brand-500">{w}</span></span>{i < arr.length - 1 ? " " : ""}</span>)}
            </span>
          </h1>
          <p data-hero="body" className="mt-7 max-w-xl text-lg leading-relaxed text-ink-soft md:text-xl">{hero.body}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <div data-hero="cta"><Button href="/classes/" size="lg" className="w-full sm:w-auto">Explore Our Classes <ArrowRight className="h-5 w-5" /></Button></div>
            <div data-hero="cta"><Button href="/about/#teachers" variant="light" size="lg" className="w-full sm:w-auto">Meet Our Teachers <Users className="h-5 w-5" /></Button></div>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-semibold text-ink-soft">
            {site.serviceTimes.map((s) => <li key={s.label} data-hero="secondary" className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-brand-500" />{s.label} · <span className="text-ink">{s.time}</span></li>)}
          </ul>
        </div>

        {/* foreground visual — moves toward the cursor */}
        <div data-hero-scroll="visual" className="relative mx-auto w-full max-w-[560px]">
          <div data-depth="12">
            <div data-hero="visual" data-hero-tilt className="relative aspect-[5/6] overflow-hidden rounded-[3rem] border-[3px] border-ink bg-white shadow-[10px_10px_0_0_#0B1530] sm:aspect-[1/1]">
              <div data-hero-scroll="media" className="absolute -inset-y-[6%] inset-x-0">
                <Scene scene={hero.image.scene} tone={hero.image.tone} title={hero.image.alt} className="h-full w-full" />
              </div>
            </div>
          </div>

          {lesson && (
            <div data-depth="26" className="absolute -left-3 bottom-8 max-w-[250px] sm:-left-10">
              <div data-hero="deco" className="rounded-3xl bg-white p-4 shadow-lift ring-1 ring-ink/5">
                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.08em] text-brand-600"><BookOpen className="h-3.5 w-3.5" />This Sunday</p>
                <p className="mt-1 font-display text-lg font-semibold leading-tight text-ink">{lesson.title}</p>
                <p className="text-sm text-ink-mute">{lesson.reference}</p>
              </div>
            </div>
          )}
          <div data-depth="34" className="absolute -right-2 top-8 sm:-right-8">
            <div data-hero="deco" className="flex items-center gap-3 rounded-full bg-ink py-2 pl-2 pr-5 text-white shadow-lift">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sun-400"><Users className="h-5 w-5 text-ink" /></span>
              <span className="leading-tight"><b className="block font-display text-lg">9 classes</b><span className="text-xs text-white/70">ages 3 to 13</span></span>
            </div>
          </div>
          <div data-depth="20" className="absolute -bottom-5 right-6">
            <div data-hero="deco" className="flex items-center gap-2 rounded-full bg-coral-400 px-4 py-2.5 font-display font-semibold text-white shadow-lift">
              <Heart className="h-4 w-4 fill-white" /> Safe & trained teachers
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Write-on headline: each word types in, rests, then erases for the next (pauses while off screen). */
function typeLoop(root: HTMLElement) {
  const typed = root.querySelector<HTMLElement>(".hero-type");
  const caret = root.querySelector<HTMLElement>(".hero-caret");
  const list = (typed?.dataset.words || "").split("|").filter(Boolean);
  if (!typed || !caret || list.length < 2) return null;
  const loop = gsap.timeline({ paused: true, repeat: -1 });
  // Each word types in, holds its moment, then dissolves (fade + lift + blur) before the next takes its place.
  list.forEach((word, i) => {
    loop.call(() => { typed.style.color = typeTones[i % typeTones.length]; caret.style.background = typeTones[i % typeTones.length]; caret.classList.add("is-typing"); })
      .set(typed, { text: "\u200b", autoAlpha: 1, y: 4, filter: "blur(3px)" })
      .to(typed, { y: 0, filter: "blur(0px)", duration: 0.4, ease: "power3.out" })
      .to(typed, { text: { value: word }, duration: Math.min(0.9, 0.1 + word.length * 0.07), ease: "none" }, "<")
      .call(() => caret.classList.remove("is-typing"))
      .to({}, { duration: 1.4 })
      .to(typed, { autoAlpha: 0, y: -6, filter: "blur(5px)", duration: 0.5, ease: "power2.in" })
      .to({}, { duration: 0.15 });
  });
  let started = false;
  const st = whileVisible(typed, (on) => { if (started) loop[on ? "resume" : "pause"](); });
  return {
    start: () => { started = true; typed.textContent = "\u200b"; loop.play(0); },
    kill: () => { loop.kill(); st.kill(); },
  };
}
