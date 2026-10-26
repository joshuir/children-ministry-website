"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Cookie, X } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { isReduced } from "@/lib/motion-pref";
import { readConsent, saveConsent } from "@/lib/consent";

/**
 * Cookie banner: Accept all and Reject non-essential carry equal weight (no nudging), and
 * Manage preferences opens per-category switches. Nothing optional loads before a choice.
 */
export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [manage, setManage] = useState(false);
  const [media, setMedia] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.pathname.startsWith("/admin")) return;
    const c = readConsent();
    setMedia(c.media);
    if (!c.decided) setShow(true);
    const open = () => { setMedia(readConsent().media); setManage(true); setShow(true); };
    window.addEventListener("cm:consent-open", open);
    return () => window.removeEventListener("cm:consent-open", open);
  }, []);

  useGSAP(() => {
    if (!show || !box.current || isReduced()) return;
    gsap.fromTo(box.current, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" });
  }, { dependencies: [show, manage] });

  useEffect(() => {
    if (!show || !manage) return;
    box.current?.querySelector<HTMLElement>("input, button")?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape" && readConsent().decided) setShow(false); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [show, manage]);

  const decide = (m: boolean) => { saveConsent({ media: m }); setShow(false); setManage(false); };

  if (!show) return null;
  const btn = "inline-flex min-h-[48px] items-center justify-center rounded-full px-5 font-display text-[15px] font-bold transition-colors duration-150";

  return (
    <div className={clsx("fixed inset-x-0 bottom-0 z-[90] px-3 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:px-5", manage && "inset-y-0 grid place-items-end bg-ink/40 sm:place-items-center")}>
      <div ref={box} role="dialog" aria-modal={manage} aria-labelledby="cc-title" aria-describedby="cc-body"
        className="mx-auto w-full max-w-3xl rounded-[1.75rem] bg-white p-5 text-ink shadow-lift ring-1 ring-ink/10 sm:p-6">
        <div className="flex items-start gap-4">
          <span aria-hidden className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sun-100 sm:flex"><Cookie className="h-6 w-6 text-sun-600" /></span>
          <div className="min-w-0 flex-1">
            <h2 id="cc-title" className="font-display text-xl font-bold">{manage ? "Cookie preferences" : "We value your privacy"}</h2>
            <p id="cc-body" className="mt-1 text-[15px] leading-relaxed text-ink-soft">
              We use essential storage to make this site work. With your permission, we&apos;ll also show maps, videos and social posts from other sites, which may set their own cookies. We don&apos;t use advertising or tracking cookies. <Link href="/privacy/#cookies" className="font-semibold text-brand-600 underline underline-offset-2">Privacy &amp; cookies</Link>
            </p>
          </div>
          {manage && readConsent().decided && <button type="button" onClick={() => setShow(false)} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-paper"><X className="h-5 w-5" /></button>}
        </div>

        {manage && (
          <ul className="mt-5 grid gap-3">
            <li className="flex items-start justify-between gap-4 rounded-2xl bg-paper p-4">
              <span><b className="block font-display">Essential</b><span className="text-sm text-ink-mute">Keeps the site working: staff sign-in, your Bible game progress, comment name and reactions — stored only on this device. Always on.</span></span>
              <span className="shrink-0 rounded-full bg-mint-100 px-3 py-1 text-xs font-extrabold uppercase tracking-[0.06em] text-mint-600">Always on</span>
            </li>
            <li className="rounded-2xl bg-paper p-4">
              <label className="flex cursor-pointer items-start justify-between gap-4">
                <span><b className="block font-display">Maps, videos &amp; social posts</b><span className="text-sm text-ink-mute">Google Maps, YouTube, Facebook, Instagram and TikTok. These services may set cookies. Off: you&apos;ll see a link instead.</span></span>
                <input type="checkbox" role="switch" checked={media} onChange={(e) => setMedia(e.target.checked)} className="peer sr-only" />
                <span aria-hidden className="relative mt-1 h-7 w-12 shrink-0 rounded-full bg-ink/20 transition-colors peer-checked:bg-brand-500 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-500/30 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
              </label>
            </li>
          </ul>
        )}

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {manage ? (
            <>
              <button type="button" onClick={() => decide(false)} className={clsx(btn, "bg-paper ring-1 ring-ink/15 hover:bg-ink/5")}>Reject non-essential</button>
              <button type="button" onClick={() => decide(media)} className={clsx(btn, "bg-ink text-white hover:bg-ink-soft")}>Save preferences</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setManage(true)} className={clsx(btn, "text-brand-600 hover:bg-brand-50 sm:mr-auto")}>Manage preferences</button>
              <button type="button" onClick={() => decide(false)} className={clsx(btn, "bg-ink text-white hover:bg-ink-soft")}>Reject non-essential</button>
              <button type="button" onClick={() => decide(true)} className={clsx(btn, "bg-ink text-white hover:bg-ink-soft")}>Accept all</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Shown in place of a third-party embed until the visitor allows maps, videos and social posts. */
export function ConsentPlaceholder({ label, href, className }: { label: string; href?: string; className?: string }) {
  return (
    <div className={clsx("flex flex-col items-center justify-center gap-3 rounded-3xl bg-paper p-6 text-center ring-1 ring-ink/10", className)}>
      <Cookie aria-hidden className="h-7 w-7 text-sun-600" />
      <p className="max-w-xs text-sm font-semibold text-ink-soft">This {label} comes from another site that may set cookies.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" onClick={() => saveConsent({ media: true })} className="inline-flex min-h-[44px] items-center rounded-full bg-ink px-4 text-sm font-bold text-white">Allow and show</button>
        {href && <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center rounded-full bg-white px-4 text-sm font-bold ring-1 ring-ink/15">Open in a new tab</a>}
      </div>
    </div>
  );
}
