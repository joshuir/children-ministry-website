"use client";

import { isReduced } from "@/lib/motion-pref";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Check, ChevronDown, Copy, RefreshCw } from "lucide-react";
import { gsap, useGSAP } from "@/lib/gsap";
import { syncLinks } from "@/lib/calendar";

/** Brand-neutral marks so the menu reads at a glance without using anyone's logo. */
const Mark = ({ c, t }: { c: string; t: string }) => (
  <span aria-hidden className={clsx("flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold", c)}>{t}</span>
);

/**
 * "Sync calendar" — one click subscribes the family's calendar app to the ministry feed,
 * so every event staff add or change in the content manager appears on their phone automatically.
 */
export function CalendarSync({ name, compact }: { name: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [host, setHost] = useState("");
  const [copied, setCopied] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => setHost(location.host), []);
  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  useGSAP(() => {
    if (!open || !menu.current || isReduced()) return;
    gsap.fromTo(menu.current, { autoAlpha: 0, y: -6, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.25, ease: "power3.out" });
    gsap.fromTo(menu.current.querySelectorAll("[data-sync-item]"), { autoAlpha: 0, x: -6 }, { autoAlpha: 1, x: 0, duration: 0.25, stagger: 0.04, ease: "power2.out" });
  }, { dependencies: [open] });

  const l = host ? syncLinks(host, name) : null;
  const items = l ? [
    { id: "google", label: "Google Calendar", hint: "Android & Gmail", href: l.google, mark: <Mark c="bg-brand-500 text-white" t="G" />, external: true },
    { id: "apple", label: "Apple Calendar", hint: "iPhone, iPad & Mac", href: l.apple, mark: <Mark c="bg-ink text-white" t="A" /> },
    { id: "outlook", label: "Outlook", hint: "Outlook.com & Microsoft 365", href: l.outlook, mark: <Mark c="bg-sun-400 text-ink" t="O" />, external: true },
  ] : [];

  async function copy() {
    if (!l) return;
    try { await navigator.clipboard.writeText(l.feed); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard blocked */ }
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        className={clsx("btn btn-sun inline-flex min-h-[48px] items-center gap-2 rounded-full bg-sun-400 px-5 text-sm font-bold text-ink", compact && "min-h-[44px] px-4")}
      >
        <RefreshCw className="h-4 w-4" />
        <span className="btn-label">Sync calendar</span>
        <ChevronDown className={clsx("h-4 w-4 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div ref={menu} role="menu" className="absolute right-0 z-40 mt-2 w-[min(320px,calc(100vw-2rem))] origin-top-right rounded-3xl bg-white p-2 shadow-lift ring-1 ring-ink/10">
          <p className="px-3 pb-2 pt-2 text-xs font-bold uppercase tracking-[0.08em] text-ink-mute">One tap — new events appear automatically</p>
          {items.map((i) => (
            <a
              key={i.id}
              role="menuitem"
              data-sync-item
              href={i.href}
              {...(i.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              onClick={() => setOpen(false)}
              className="flex min-h-[52px] items-center gap-3 rounded-2xl px-3 py-2 transition-colors duration-150 hover:bg-brand-50 focus-visible:bg-brand-50"
            >
              {i.mark}
              <span className="leading-tight"><b className="block font-display text-[15px] font-semibold">{i.label}</b><span className="text-xs text-ink-mute">{i.hint}</span></span>
            </a>
          ))}
          <button type="button" role="menuitem" data-sync-item onClick={copy} className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors duration-150 hover:bg-brand-50">
            <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper ring-1 ring-ink/10">{copied ? <Check className="h-4 w-4 text-mint-600" /> : <Copy className="h-4 w-4" />}</span>
            <span className="leading-tight"><b className="block font-display text-[15px] font-semibold">{copied ? "Link copied" : "Copy feed link"}</b><span className="text-xs text-ink-mute">For any other calendar app</span></span>
          </button>
          <span className="sr-only" aria-live="polite">{copied ? "Calendar link copied" : ""}</span>
        </div>
      )}
    </div>
  );
}
