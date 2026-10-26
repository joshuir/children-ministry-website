import { MotionToggle } from "./MotionToggle";
import Link from "next/link";
import { ArrowRight, Clock, LockKeyhole, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { Logo, buttonClass } from "./ui";
import { SocialLinks } from "./SocialLinks";
import { FooterWordmark } from "./FooterWordmark";
import type { GroupInfo, SectionText, SiteSettings } from "@/lib/types";

const quick = [
  { href: "/", label: "Home" }, { href: "/about/", label: "About us" }, { href: "/classes/", label: "Classes" },
  { href: "/events/", label: "Events" }, { href: "/blog/", label: "Feed" }, { href: "/gallery/", label: "Gallery" }, { href: "/contact/", label: "Contact" },
];
const legal = [
  { href: "/privacy/", label: "Privacy" }, { href: "/terms/", label: "Terms" },
  { href: "/safeguarding/", label: "Safeguarding" }, { href: "/accessibility/", label: "Accessibility" },
];

const heading = "text-xs font-extrabold uppercase tracking-[0.14em] text-white/45";

export function Footer({ site, groups, visit }: { site: SiteSettings; groups: GroupInfo[]; visit?: SectionText }) {
  const title = (visit?.title || "Come as you are this Sunday.").trim().split(" ");
  const cut = title.length > 3 ? title.length - 2 : title.length;
  const linkCls = "link-draw inline-flex min-h-[36px] items-center font-semibold text-white/80 transition-colors duration-100 hover:text-sun-300";
  return (
    <footer className="relative mt-auto overflow-hidden bg-ink text-white">
      <svg aria-hidden className="absolute -top-px left-0 w-full text-paper" viewBox="0 0 1440 40" preserveAspectRatio="none"><path d="M0 0h1440v8c-240 30-480 30-720 12S240-4 0 20z" fill="currentColor" /></svg>
      <div aria-hidden className="pointer-events-none absolute -right-40 top-10 h-[420px] w-[420px] rounded-full" style={{ background: "radial-gradient(circle, rgba(37,99,235,.28) 0%, transparent 68%)" }} />

      <div className="container relative pb-8 pt-24 md:pt-28">
        {/* 1. Invitation */}
        <div className="grid gap-10 border-b border-white/10 pb-14 lg:grid-cols-[1.25fr_1fr] lg:items-end lg:gap-16">
          <div>
            <p className={heading}>{visit?.eyebrow || "Visit us"}</p>
            <h2 data-split className="mt-4 font-display text-[calc(var(--h-scale)*clamp(2.4rem,5.5vw,4.5rem))] font-extrabold leading-[0.95] tracking-[-0.035em]">
              {title.slice(0, cut).join(" ")} {cut < title.length && <span className="text-sun-400">{title.slice(cut).join(" ")}</span>}
            </h2>
          </div>
          <div>
            <ul className="divide-y divide-white/10 rounded-3xl bg-white/[0.06] px-5 ring-1 ring-white/10">
              {site.serviceTimes.map((s) => (
                <li key={s.label} className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                  <span className="flex items-center gap-2.5 font-semibold text-white/80"><Clock className="h-4 w-4 shrink-0 text-sun-400" aria-hidden />{s.label}</span>
                  <span className="whitespace-nowrap pl-[26px] font-display font-bold sm:pl-0">{s.time}</span>
                </li>
              ))}
            </ul>
            {visit?.body && <p className="mt-4 text-white/65">{visit.body}</p>}
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={site.cta.href} className={buttonClass("sun", "md")}>{site.cta.label} <ArrowRight className="h-4 w-4" /></Link>
              <a href={`https://wa.me/${site.contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className={`${buttonClass("ghost", "md")} !text-white ring-1 ring-white/20 hover:!bg-white/10`}><MessageCircle className="h-4 w-4" /> WhatsApp us</a>
            </div>
          </div>
        </div>

        {/* 2. Directory */}
        <div className="grid gap-x-10 gap-y-12 pt-14 sm:grid-cols-2 lg:grid-cols-12">
          <div className="sm:col-span-2 lg:col-span-3">
            <Logo light />
            <p className="mt-5 max-w-sm leading-relaxed text-white/65">{site.description}</p>
            <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white/90">
              <ShieldCheck className="h-4 w-4 text-mint-400" aria-hidden /> All teachers safeguarding-trained
            </p>
            <div className="mt-6"><SocialLinks links={site.socials} variant="dark" /></div>
          </div>

          <nav aria-label="Explore" className="lg:col-span-3">
            <h2 className={heading}>Explore</h2>
            <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-0.5">{quick.map((l) => <li key={l.href}><Link href={l.href} data-scramble className={linkCls}>{l.label}</Link></li>)}</ul>
          </nav>

          <nav aria-label="Classes" className="lg:col-span-2">
            <h2 className={heading}>Classes</h2>
            <ul className="mt-4 grid gap-0.5">
              {groups.map((g) => <li key={g.id}><Link href={`/classes/#${g.id}`} className={linkCls}>{g.name}<span className="ml-2 text-sm font-normal text-white/40">{g.ages}</span></Link></li>)}
            </ul>
          </nav>

          <div className="sm:col-span-2 lg:col-span-4">
            <h2 className={heading}>Get in touch</h2>
            <ul className="mt-4 grid gap-3.5 text-white/80">
              <li><a href={`tel:${site.contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 font-semibold hover:text-sun-300"><Phone className="h-4 w-4 shrink-0 text-sun-400" aria-hidden />{site.contact.phone}</a></li>
              <li><a href={`mailto:${site.contact.email}`} className="flex items-center gap-3 font-semibold [overflow-wrap:anywhere] hover:text-sun-300"><Mail className="h-4 w-4 shrink-0 text-sun-400" aria-hidden />{site.contact.email}</a></li>
              <li><Link href="/contact/#map" className="flex items-start gap-3 hover:text-sun-300"><MapPin className="mt-1 h-4 w-4 shrink-0 text-sun-400" aria-hidden /><address className="not-italic leading-relaxed">{site.contact.address.join(", ")}</address></Link></li>
            </ul>
          </div>
        </div>

        {/* 3. Sign-off */}
        <FooterWordmark text={site.shortName} />

        <div className="mt-6 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm md:flex-row md:items-center md:justify-between">
          <p className="text-white/50">© {new Date().getFullYear()} {site.name} · {site.church}</p>
          <MotionToggle />
          <ul className="flex flex-wrap gap-x-5 gap-y-1">{legal.map((l) => <li key={l.href}><Link href={l.href} className="link-draw inline-flex min-h-[36px] items-center text-white/60 hover:text-white">{l.label}</Link></li>)}</ul>
          <Link href="/admin" prefetch={false} rel="nofollow" className="group inline-flex min-h-[36px] items-center gap-2 self-start rounded-full px-3 text-white/45 ring-1 ring-white/10 transition-colors duration-150 hover:bg-white/5 hover:text-white hover:ring-white/30 md:self-auto">
            <LockKeyhole className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-rotate-12" aria-hidden />Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}
