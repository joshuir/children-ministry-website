"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import clsx from "clsx";
import { ArrowUpRight, CalendarDays, GraduationCap, House, Images, Info, Menu, MessageCircle, Newspaper, X, type LucideIcon } from "lucide-react";
import { Logo, buttonClass } from "./ui";
import { Scene } from "./Scene";
import type { ClassInfo, GroupInfo, SiteSettings } from "@/lib/types";

const links: { href: string; label: string; icon: LucideIcon; mega?: boolean }[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/about/", label: "About", icon: Info },
  { href: "/classes/", label: "Classes", icon: GraduationCap, mega: true },
  { href: "/events/", label: "Events", icon: CalendarDays },
  { href: "/blog/", label: "Blog", icon: Newspaper },
  { href: "/gallery/", label: "Gallery", icon: Images },
  { href: "/contact/", label: "Contact", icon: MessageCircle },
];

const groupDot: Record<string, string> = { sun: "bg-sun-400", mint: "bg-mint-400", coral: "bg-coral-400", lilac: "bg-lilac-400", blue: "bg-brand-500", ink: "bg-ink" };
const groupSoft: Record<string, string> = { sun: "bg-sun-100", mint: "bg-mint-100", coral: "bg-coral-100", lilac: "bg-lilac-100", blue: "bg-brand-50", ink: "bg-ink/5" };

type MiniClass = Pick<ClassInfo, "id" | "name" | "group" | "ages">;

export function Navbar({ site, groups, classes }: { site: SiteSettings; groups: GroupInfo[]; classes: MiniClass[] }) {
  const pathname = usePathname() || "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mega, setMega] = useState(false);
  const [hoverGroup, setHoverGroup] = useState(groups[0]?.id);
  const openTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pill = useRef<HTMLSpanElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // A soft pill glides between links as the pointer moves along the menu.
  const pillAt = useRef<HTMLElement | null>(null);
  function movePill(e: MouseEvent<HTMLUListElement>) {
    const a = (e.target as HTMLElement).closest<HTMLElement>("[data-navlink]");
    if (!a || !pill.current || a.getAttribute("aria-current") === "page") return;
    // Only animate when the pointer reaches a different link — not on every mousemove.
    if (a === pillAt.current && gsap.getProperty(pill.current, "opacity") !== 0) return;
    pillAt.current = a;
    const ul = e.currentTarget.getBoundingClientRect(), r = a.getBoundingClientRect();
    const first = gsap.getProperty(pill.current, "opacity") === 0;
    gsap.to(pill.current, { x: r.left - ul.left, width: r.width, opacity: 1, duration: first ? 0 : 0.28, ease: "power3.out", overwrite: true });
  }
  const hidePill = () => { pillAt.current = null; if (pill.current) gsap.to(pill.current, { opacity: 0, duration: 0.2 }); };

  const showMega = () => { clearTimeout(closeTimer.current); openTimer.current = setTimeout(() => setMega(true), 90); };
  const hideMega = () => { clearTimeout(openTimer.current); closeTimer.current = setTimeout(() => setMega(false), 160); };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); setMega(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && (setOpen(false), setMega(false));
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Hover screen entrance: tiles cascade in.
  useGSAP(() => {
    if (!mega || !panel.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.fromTo("[data-mega-tile]", { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.05, ease: "power3.out", overwrite: true });
  }, { scope: panel, dependencies: [mega] });

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.replace(/\/$/, "")));
  const megaOpen = mega && !open;

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-5 md:pt-4">
      <nav
        aria-label="Main"
        className={clsx(
          "relative z-[2] mx-auto flex max-w-[1240px] items-center justify-between gap-4 rounded-full py-2 pl-4 pr-2 transition-all duration-300 md:pl-5",
          scrolled || open || megaOpen ? "bg-white/90 shadow-card ring-1 ring-ink/5 backdrop-blur-xl" : "bg-white/0",
        )}
      >
        <Logo compact />

        <ul className="relative hidden items-center gap-0.5 lg:flex" onMouseOver={movePill} onMouseLeave={hidePill}>
          <span ref={pill} aria-hidden className="pointer-events-none absolute left-0 top-1/2 h-10 w-0 -translate-y-1/2 rounded-full bg-brand-100 opacity-0" />
          {links.map((l) => (
            <li
              key={l.href}
              onMouseEnter={l.mega ? showMega : undefined}
              onMouseLeave={l.mega ? hideMega : undefined}
              onFocus={l.mega ? () => setMega(true) : undefined}
              onBlur={l.mega ? (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node) && !panel.current?.contains(e.relatedTarget as Node)) setMega(false); } : undefined}
            >
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                aria-expanded={l.mega ? megaOpen : undefined}
                aria-controls={l.mega ? "classes-screen" : undefined}
                data-navlink
                data-scramble
                className={navItem(isActive(l.href))}
              >
                <l.icon aria-hidden className="nav-ico h-[15px] w-[15px] shrink-0 opacity-60 transition-[opacity,transform] duration-200 group-hover/nav:opacity-100" strokeWidth={2.4} />
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link href={site.cta.href} className={clsx(buttonClass("primary", "sm"), "hidden sm:inline-flex")}>{site.cta.label}</Link>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Classes hover screen (desktop) */}
      <div
        id="classes-screen"
        ref={panel}
        onMouseEnter={showMega}
        onMouseLeave={hideMega}
        onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setMega(false); }}
        className={clsx(
          "absolute inset-x-3 top-full z-[1] hidden pt-3 transition-[opacity,transform,visibility] duration-200 md:inset-x-5 lg:block",
          megaOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0",
        )}
      >
        <div className="mx-auto max-w-[1240px] overflow-hidden rounded-[2rem] bg-white p-3 shadow-lift ring-1 ring-ink/5">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_260px] gap-3">
            {groups.map((g) => (
              <Link
                key={g.id}
                href={`/classes/#${g.id}`}
                data-mega-tile
                onMouseEnter={() => setHoverGroup(g.id)}
                onFocus={() => setHoverGroup(g.id)}
                className={clsx("group relative flex min-h-[230px] flex-col overflow-hidden rounded-3xl p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-card", groupSoft[g.tone])}
              >
                <span className="flex items-center justify-between">
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-ink">{g.ages}</span>
                  <ArrowUpRight className="h-5 w-5 text-ink transition-transform duration-200 group-hover:rotate-45" />
                </span>
                <span className="mt-3 font-display text-2xl font-extrabold tracking-tight text-ink">{g.name}</span>
                <span className="text-sm font-bold text-ink-mute">{classes.filter((c) => c.group === g.id).length} classes</span>
                <span className="-mx-4 -mb-4 mt-auto block aspect-[16/9] overflow-hidden pt-2">
                  <Scene scene={g.scene} tone={g.tone} className="h-full w-full transition-transform duration-500 group-hover:scale-110" />
                </span>
              </Link>
            ))}
            <div data-mega-tile className="flex flex-col rounded-3xl bg-ink p-4 text-white">
              <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-sun-300">
                <span className={clsx("h-2.5 w-2.5 rounded-full", groupDot[groups.find((g) => g.id === hoverGroup)?.tone || "blue"])} />
                {groups.find((g) => g.id === hoverGroup)?.name}
              </p>
              <ul className="mt-3 grid gap-1">
                {classes.filter((c) => c.group === hoverGroup).map((c) => (
                  <li key={c.id}>
                    <Link href={`/classes/${c.id}/`} className="flex min-h-[40px] items-center justify-between rounded-xl px-3 font-bold transition-colors hover:bg-white/10">
                      {c.name}<span className="text-xs font-semibold text-white/50">{c.ages}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/classes/" className="mt-auto inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-white/10 px-4 text-sm font-bold transition-colors hover:bg-white hover:text-ink">All classes <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={clsx(
          "fixed inset-x-3 bottom-3 top-[84px] overflow-y-auto rounded-4xl bg-white p-3 shadow-lift ring-1 ring-ink/5 transition-all duration-300 lg:hidden",
          open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-3 opacity-0",
        )}
      >
        <ul className="grid gap-1">
          {links.map((l, i) => (
            <li key={l.href} style={{ transitionDelay: open ? `${60 + i * 35}ms` : "0ms" }} className={clsx("transition-all duration-300", open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")}>
              <Link
                href={l.href}
                aria-current={isActive(l.href) ? "page" : undefined}
                className={clsx("flex min-h-[56px] items-center gap-3 rounded-2xl px-5 font-display text-2xl font-extrabold", isActive(l.href) ? "bg-brand-500 text-white" : "text-ink hover:bg-brand-50")}
              >
                <l.icon aria-hidden className={clsx("h-5 w-5", isActive(l.href) ? "text-white/80" : "text-ink-mute")} strokeWidth={2.4} />
                {l.label}
                {isActive(l.href) && <span className="ml-auto h-2.5 w-2.5 rounded-full bg-sun-400" />}
              </Link>
              {l.mega && (
                <div className="grid grid-cols-2 gap-2 px-2 pb-2 pt-2">
                  {groups.map((g) => (
                    <Link key={g.id} href={`/classes/#${g.id}`} className={clsx("flex min-h-[52px] items-center gap-2 rounded-xl px-3 text-[15px] font-bold text-ink", groupSoft[g.tone])}>
                      <span className={clsx("h-2.5 w-2.5 rounded-full", groupDot[g.tone])} />{g.name}<span className="ml-auto text-xs text-ink-mute">{g.ages}</span>
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
        <Link href={site.cta.href} className={clsx(buttonClass("primary", "lg"), "mt-4 w-full")}>{site.cta.label}</Link>
        <p className="mt-4 px-2 text-center text-sm text-ink-mute">{site.serviceTimes[0].label} · {site.serviceTimes[0].time}</p>
      </div>
    </header>
  );
}

function navItem(active: boolean) {
  return clsx(
    "group/nav relative z-[1] inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-[15px] font-bold transition-colors duration-100 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-brand-500 xl:px-3.5",
    active ? "bg-ink text-white [&_.nav-ico]:opacity-90" : "text-ink-soft hover:text-ink",
  );
}
