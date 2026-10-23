import { BellRing, BookOpen, Headphones, Palette, Smartphone } from "lucide-react";
import { QRCode } from "./QRCode";
import { LogoMark } from "./ui";
import type { SiteSettings } from "@/lib/types";

function StoreButton({ href, store }: { href: string; store: "google" | "apple" }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[56px] items-center gap-3 rounded-2xl bg-ink px-5 text-white shadow-[0_4px_0_0_#000] transition-transform hover:-translate-y-0.5 active:translate-y-[3px] active:shadow-none">
      {store === "google" ? (
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden><path d="M4 2.5v19l10-9.5z" fill="#4FA8FF" /><path d="M4 2.5l13 7.4-3 2.6z" fill="#5B8CFF" /><path d="M4 21.5l13-7.4-3-2.6z" fill="#FF7A59" /><path d="M17 9.9l3.4 2.1-3.4 2.1-3-2.1z" fill="#FFC53D" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden><path d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.8.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.3.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.8-1.1-2.8-4.3zM13.9 5.3c.7-.9 1.2-2 1-3.2-1 .1-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.1 1.1.1 2.3-.6 3.1-1.5z" /></svg>
      )}
      <span className="text-left leading-tight">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-white/70">{store === "google" ? "Get it on" : "Download on the"}</span>
        <span className="block font-display text-lg font-semibold">{store === "google" ? "Google Play" : "App Store"}</span>
      </span>
    </a>
  );
}

function PhoneMock() {
  return (
    <div className="relative mx-auto w-[260px] rounded-[44px] bg-ink p-3 shadow-lift" aria-hidden>
      <div className="absolute left-1/2 top-5 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-ink" />
      <div className="overflow-hidden rounded-[34px] bg-paper">
        <div className="bg-brand-500 px-5 pb-6 pt-12 text-white">
          <div className="flex items-center gap-2"><LogoMark size={30} /><span className="font-display font-semibold">Children&apos;s Ministry</span></div>
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-white/70">This Sunday · Primary 2</p>
          <p className="font-display text-xl font-semibold leading-tight">The Good Samaritan</p>
        </div>
        <div className="-mt-3 space-y-2.5 px-4 pb-6">
          <div className="rounded-2xl bg-white p-3 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Memory verse</p>
            <p className="font-display text-sm font-semibold leading-snug">“Love your neighbour as yourself.”</p>
            <div className="mt-2 flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-sun-400"><Headphones className="h-3 w-3" /></span><span className="h-1.5 flex-1 rounded-full bg-ink/10"><span className="block h-full w-1/3 rounded-full bg-brand-500" /></span></div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-mint-100 p-3"><Palette className="h-4 w-4 text-mint-600" /><p className="mt-2 text-xs font-bold">Colouring</p></div>
            <div className="rounded-2xl bg-coral-100 p-3"><BookOpen className="h-4 w-4 text-coral-600" /><p className="mt-2 text-xs font-bold">Story</p></div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sun-100"><BellRing className="h-4 w-4 text-sun-600" /></span><div><p className="text-xs font-bold">Children&apos;s Harvest</p><p className="text-[10px] text-ink-mute">Sun 25 Oct · 9:00 am</p></div></div>
        </div>
      </div>
    </div>
  );
}

/** The real QR image uploaded in the CMS, or one generated from the QR link. */
export function QrBlock({ app, size = 104 }: { app: SiteSettings["app"]; size?: number }) {
  return app.qrImage
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={app.qrImage} alt={`QR code — ${app.qrCaption || "scan to download the app"}`} width={size} height={size} className="block object-contain" style={{ width: size, height: size }} />
    : <QRCode value={app.qrUrl} size={size} label={`QR code linking to ${app.qrUrl}`} />;
}

export function AppDownload({ app, title, eyebrow }: { app: SiteSettings["app"]; title?: string; eyebrow?: string }) {
  return (
    <div className="relative overflow-hidden rounded-5xl bg-sun-100 px-6 py-12 md:px-14 md:py-16">
      <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-sun-300/60" />
      <div aria-hidden className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-white/50" />
      <div className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span data-reveal className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em] text-sun-600"><Smartphone className="h-4 w-4" /> {eyebrow || "Mobile app"}</span>
          <h2 data-reveal className="mt-5 font-display text-[calc(var(--h-scale)*clamp(2rem,4.2vw,3.25rem))] font-bold leading-[1.04] tracking-[-0.02em] text-ink">{title || "Sunday's lesson, all week long"}</h2>
          <p data-reveal className="mt-4 max-w-lg text-lg leading-relaxed text-ink-soft">{app.blurb}</p>
          <div data-reveal className="mt-8 flex flex-wrap gap-3">
            <StoreButton href={app.playStoreUrl} store="google" />
            <StoreButton href={app.appStoreUrl} store="apple" />
          </div>
          <div data-reveal className="mt-8 inline-flex items-center gap-5 rounded-3xl bg-white p-4 pr-6 shadow-card">
            <div className="rounded-2xl bg-white p-1.5 ring-2 ring-ink/10"><QrBlock app={app} /></div>
            <div>
              <p className="font-display text-xl font-extrabold text-ink">Scan to download</p>
              <p className="mt-1 max-w-[200px] text-sm font-semibold leading-snug text-ink-mute">{app.qrCaption || "Point your phone camera here."}</p>
            </div>
          </div>
        </div>
        <div data-reveal data-parallax="-8"><PhoneMock /></div>
      </div>
    </div>
  );
}
