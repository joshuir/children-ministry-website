import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.png";
import clsx from "clsx";
import { Children, type ReactNode } from "react";
import { Scene } from "./Scene";
import { InteractiveHero } from "./InteractiveHero";
import type { Media, PageHeroContent, Tone } from "@/lib/types";

/* ---------------- Buttons ---------------- */

type BtnVariant = "primary" | "dark" | "light" | "ghost" | "sun";
const btn: Record<BtnVariant, string> = {
  primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-[0_4px_0_0_#173EA8] active:shadow-[0_1px_0_0_#173EA8]",
  dark: "bg-ink text-white hover:bg-ink-soft shadow-[0_4px_0_0_#000] active:shadow-[0_1px_0_0_#000]",
  sun: "bg-sun-400 text-ink hover:bg-sun-300 shadow-[0_4px_0_0_#B7791F] active:shadow-[0_1px_0_0_#B7791F]",
  light: "bg-white text-ink ring-2 ring-ink/10 hover:ring-ink/25 shadow-[0_4px_0_0_rgba(11,21,48,.12)] active:shadow-none",
  ghost: "text-ink hover:bg-ink/5",
};

export function buttonClass(variant: BtnVariant = "primary", size: "md" | "lg" | "sm" = "md") {
  return clsx(
    `btn btn-${variant} inline-flex items-center justify-center gap-2 rounded-full font-display font-semibold tracking-tight transition-[box-shadow,background-color,color,--tw-ring-color] duration-300 active:translate-y-[3px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-60 disabled:pointer-events-none`,
    size === "lg" && "min-h-[56px] px-7 text-[17px]",
    size === "md" && "min-h-[48px] px-6 text-[15px]",
    size === "sm" && "min-h-[40px] px-4 text-sm",
    btn[variant],
  );
}

/** Wraps text in .btn-label so the hover choreography can shift it independently of the icon. */
export function btnContent(children: ReactNode) {
  return Children.map(children, (c) => (typeof c === "string" || typeof c === "number" ? <span className="btn-label">{c}</span> : c));
}

export function Button({ href, children, variant = "primary", size = "md", className, attention: _attention, ...rest }: { href: string; children: ReactNode; variant?: BtnVariant; size?: "md" | "lg" | "sm"; className?: string; target?: string; rel?: string; "aria-label"?: string; attention?: boolean }) {
  void _attention; // (the old idle "wiggle" was removed — it competed with the content)
  const external = /^https?:|^mailto:|^tel:/.test(href);
  if (external) return <a href={href} className={clsx(buttonClass(variant, size), className)} {...rest}>{btnContent(children)}</a>;
  return <Link href={href} className={clsx(buttonClass(variant, size), className)} {...rest}>{btnContent(children)}</Link>;
}

/* ---------------- Section scaffolding ---------------- */

export function Eyebrow({ children, tone = "blue" }: { children: ReactNode; tone?: Tone }) {
  const tones: Record<Tone, string> = {
    blue: "bg-brand-100 text-brand-700", sun: "bg-sun-100 text-sun-600", coral: "bg-coral-100 text-coral-600",
    mint: "bg-mint-100 text-mint-600", lilac: "bg-lilac-100 text-lilac-400", ink: "bg-ink text-white",
  };
  return <span className={clsx("inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-bold uppercase tracking-[0.08em]", tones[tone])}><span aria-hidden data-eyebrow-line className="h-[2px] w-4 rounded-full bg-current opacity-60" />{children}</span>;
}

export function SectionHeader({ eyebrow, title, body, align = "left", tone, action, id }: { eyebrow?: string; title: ReactNode; body?: ReactNode; align?: "left" | "center"; tone?: Tone; action?: ReactNode; id?: string }) {
  return (
    <div className={clsx("mb-10 flex flex-col gap-5 md:mb-14", align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between")}>
      <div className={clsx("max-w-2xl", align === "center" && "mx-auto")} data-reveal>
        {eyebrow && <div className="mb-4"><Eyebrow tone={tone}>{eyebrow}</Eyebrow></div>}
        <h2 id={id} data-split className="font-display text-[calc(var(--h-scale)*clamp(2rem,4.2vw,3.25rem))] font-bold leading-[1.04] tracking-[-0.02em] text-ink text-balance">{title}</h2>
        {body && <p className="mt-4 text-lg leading-relaxed text-ink-mute text-pretty">{body}</p>}
      </div>
      {action && <div data-reveal className="shrink-0">{action}</div>}
    </div>
  );
}

export function PageHero({ eyebrow, title, highlight, body, tone = "blue", scene, media, stickers, children }: { eyebrow: string; title: string; highlight?: string; body?: ReactNode; tone?: Tone; scene?: Media["scene"]; media?: Media; stickers?: string[]; children?: ReactNode }) {
  const m = media && (media.src || media.scene) ? media : scene ? { alt: "", scene, tone } : undefined;
  return <InteractiveHero eyebrow={eyebrow} title={title} highlight={highlight} body={body} tone={tone} media={m} stickers={stickers}>{children}</InteractiveHero>;
}

/** Hero driven entirely by CMS page text. */
export function CmsHero({ hero, tone = "blue", children }: { hero: PageHeroContent; tone?: Tone; children?: ReactNode }) {
  return <PageHero eyebrow={hero.eyebrow} title={hero.title} highlight={hero.highlight} body={hero.body} tone={tone} media={hero.media} stickers={hero.stickers}>{children}</PageHero>;
}

/** Floating decorative shapes — purely ornamental, disabled for reduced motion. */
export function Decor({ variant = "light" }: { variant?: "light" | "dark" }) {
  const o = variant === "dark" ? "opacity-30" : "opacity-70";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <svg className={clsx("float-shape absolute left-[6%] top-[22%] w-8", o)} viewBox="0 0 20 20"><path d="M10 0C11.5 8 12 8.5 20 10C12 11.5 11.5 12 10 20C8.5 12 8 11.5 0 10C8 8.5 8.5 8 10 0Z" fill="#FFC53D" /></svg>
      <div className={clsx("float-shape absolute right-[8%] top-[18%] h-5 w-5 rounded-full border-[3px] border-brand-500", o)} style={{ animationDelay: "-2s" }} />
      <div className={clsx("float-shape absolute bottom-[8%] right-[46%] hidden h-4 w-10 rounded-full bg-coral-400 md:block", o)} style={{ animationDelay: "-4s" }} />
      <svg className={clsx("float-shape absolute bottom-[22%] right-[4%] w-7", o)} style={{ animationDelay: "-3s" }} viewBox="0 0 20 20"><path d="M2 18 L10 2 L18 18Z" fill="none" stroke="#4FA8FF" strokeWidth="3" strokeLinejoin="round" /></svg>
    </div>
  );
}

/* ---------------- Media ---------------- */

/** Renders an uploaded photo if there is one, otherwise the matching illustrated scene. */
export function MediaFrame({ media, className, priority }: { media: Media; className?: string; priority?: boolean }) {
  if (media.src && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(media.src)) {
    return <video src={media.src} muted loop playsInline autoPlay={false} preload="metadata" aria-label={media.alt} className={clsx("h-full w-full object-cover", className)} />;
  }
  if (media.src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={media.src} alt={media.alt} loading={priority ? "eager" : "lazy"} decoding="async" className={clsx("h-full w-full object-cover", className)} />;
  }
  return <Scene scene={media.scene} tone={media.tone} title={media.alt} className={clsx("h-full w-full", className)} />;
}

const avatarTones: Record<Tone, string> = {
  blue: "bg-brand-500 text-white", sun: "bg-sun-400 text-ink", coral: "bg-coral-400 text-white",
  mint: "bg-mint-400 text-ink", lilac: "bg-lilac-400 text-white", ink: "bg-ink text-white",
};

export function Avatar({ name, tone = "blue", photo, size = 44, className }: { name: string; tone?: Tone; photo?: string; size?: number; className?: string }) {
  const ini = name.replace(/\(.*?\)/g, "").trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span className={clsx("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-bold", avatarTones[tone], className)} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : ini}
    </span>
  );
}

/* ---------------- Logo ---------------- */

/** The ministry's own crest (transparent PNG). Height-driven so it sits well in any bar. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <Image src={logo} alt="" width={Math.round(size * (logo.width / logo.height))} height={size} priority className="h-auto select-none" style={{ height: size, width: "auto" }} />
  );
}

export function Logo({ light = false, compact = false }: { light?: boolean; compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-brand-500" aria-label="Presbyterian Children's Ministry — home">
      <span className="transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105"><LogoMark size={light ? 64 : 48} /></span>
      <span className={clsx("leading-none", compact && "lg:hidden xl:block")}>
        <span className={clsx("block font-display text-[18px] font-bold tracking-tight", light ? "text-white" : "text-ink")}>Children&apos;s Ministry</span>
        <span className={clsx("mt-1 block text-[11px] font-bold uppercase tracking-[0.14em]", light ? "text-white/60" : "text-ink-mute")}>Presbyterian Church</span>
      </span>
    </Link>
  );
}
