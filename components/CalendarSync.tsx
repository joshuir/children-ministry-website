"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Check, Copy, RefreshCw, X } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { isReduced } from "@/lib/motion-pref";

/**
 * "Sync calendar" — subscribes the visitor's own calendar app to the ministry's event feed, so events
 * staff add or change in the content manager appear automatically. One button, no platform logos:
 * the webcal:// link opens whatever calendar app the device uses; the copy link covers the rest.
 */
export function CalendarSync({ name, compact }: { name: string; compact?: boolean }) {
  const [host, setHost] = useState("");
  const [help, setHelp] = useState(false);
  const [copied, setCopied] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  void name;

  useEffect(() => setHost(location.host), []);
  useEffect(() => {
    if (!help) return;
    const close = (e: Event) => { if (!root.current?.contains(e.target as Node)) setHelp(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setHelp(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [help]);
  useGSAP(() => {
    if (!help || !panel.current || isReduced()) return;
    gsap.fromTo(panel.current, { autoAlpha: 0, y: -6, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.25, ease: "power3.out" });
  }, { dependencies: [help] });

  const feed = host ? `https://${host}/api/calendar` : "/api/calendar";
  async function copy() {
    try { await navigator.clipboard.writeText(feed); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  }

  return (
    <div ref={root} className="relative inline-flex items-center gap-1">
      <a href={host ? `webcal://${host}/api/calendar` : "/api/calendar"} onClick={() => setHelp(true)}
        className={clsx("btn btn-sun inline-flex min-h-[48px] items-center gap-2 rounded-full bg-sun-400 px-5 text-sm font-bold text-ink", compact && "min-h-[44px] px-4")}
        title="Subscribe in your calendar app — new and changed events appear automatically">
        <RefreshCw className="h-4 w-4" /><span className="btn-label">Sync calendar</span>
      </a>
      {help && (
        <div ref={panel} role="dialog" aria-label="Calendar sync" className="absolute right-0 top-full z-40 mt-2 w-[min(320px,calc(100vw-2rem))] rounded-3xl bg-white p-4 text-left shadow-lift ring-1 ring-ink/10">
          <div className="flex items-start justify-between gap-2">
            <p className="font-display font-bold">Your calendar app should open</p>
            <button type="button" onClick={() => setHelp(false)} aria-label="Close" className="-mr-1 -mt-1 flex h-9 w-9 items-center justify-center rounded-full hover:bg-paper"><X className="h-4 w-4" /></button>
          </div>
          <p className="mt-1 text-sm text-ink-mute">Confirm the subscription, and events will keep themselves up to date. If nothing opened, copy this link and add it to your calendar as a subscription (“From URL”).</p>
          <button type="button" onClick={copy} className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl bg-paper px-4 text-sm font-bold ring-1 ring-ink/10 hover:bg-brand-50">
            {copied ? <Check className="h-4 w-4 text-mint-600" /> : <Copy className="h-4 w-4" />}{copied ? "Link copied" : "Copy calendar link"}
          </button>
          <span className="sr-only" aria-live="polite">{copied ? "Calendar link copied" : ""}</span>
        </div>
      )}
    </div>
  );
}
