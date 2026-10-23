import type { Metadata } from "next";
import { Clock, Mail, MapPin, MessageCircle, Phone , ArrowUpRight } from "lucide-react";
import { CmsHero } from "@/components/ui";
import { ContactForm } from "@/components/ContactForm";
import { Map } from "@/components/Map";
import { Newsletter } from "@/components/Newsletter";
import { SocialGrid } from "@/components/SocialGrid";
import { QrBlock } from "@/components/AppDownload";
import { SocialEmbeds } from "@/components/SocialEmbeds";
import { getHeroText, getPages, getSections, getSite, getSocialEmbeds, getFaqs } from "@/lib/content";
import { Faq } from "@/components/Faq";

export const metadata: Metadata = {
  title: "Contact",
  description: "Visit Presbyterian Children's Ministry at the Presbyterian Church, Accra. Call, WhatsApp or email us, or send a message to our children's ministry team.",
  alternates: { canonical: "/contact/" },
};

const h2 = "font-display text-[calc(var(--h-scale)*clamp(2rem,4vw,3rem))] font-extrabold leading-[1.05]";

export default async function ContactPage() {
  const [site, hero, sec, pages, embeds, faqs] = await Promise.all([getSite(), getHeroText("contact"), getSections(), getPages(), getSocialEmbeds(), getFaqs()]);
  const c = site.contact;
  const nl = pages.newsletter;
  const cards = [
    { icon: Phone, label: "Call", value: c.phone, href: `tel:${c.phone.replace(/\s/g, "")}`, tone: "bg-brand-500 text-white" },
    { icon: MessageCircle, label: "WhatsApp", value: "Chat with us", href: `https://wa.me/${c.whatsapp}`, tone: "bg-mint-400 text-ink" },
    { icon: Mail, label: "Email", value: c.email, href: `mailto:${c.email}`, tone: "bg-sun-400 text-ink" },
    { icon: MapPin, label: "Visit", value: c.address.slice(1).join(", ") || c.address[0], href: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.mapQuery)}`, tone: "bg-coral-400 text-white" },
  ].filter((k) => k.value);

  return (
    <>
      <CmsHero hero={hero} tone="blue" />

      <section className="py-14 md:py-20" aria-label={sec("contact.cards").title || "Contact details"}>
        <div className="container">
          <ul data-card-group className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((k) => (
              <li key={k.label} data-reveal>
                <a href={k.href} target={k.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" data-card className="group flex h-full flex-col rounded-[1.75rem] bg-white p-6 shadow-card ring-1 ring-ink/[0.07]">
                  <span className="flex items-start justify-between"><span data-pop className={`flex h-12 w-12 items-center justify-center rounded-2xl ${k.tone}`}><k.icon className="h-6 w-6" /></span><span data-card-arrow aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.05] text-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-white"><ArrowUpRight className="h-4 w-4" /></span></span>
                  <span className="mt-6 text-xs font-extrabold uppercase tracking-[0.14em] text-ink-mute">{k.label}</span>
                  <span className="mt-1 font-display text-lg font-extrabold [overflow-wrap:anywhere]">{k.value}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {faqs.length > 0 && (
        <section className="pb-20 pt-4" aria-label="Frequently asked questions">
          <div className="container"><Faq items={faqs} text={sec("contact.faq")} contactHref="#form-title" compact /></div>
        </section>
      )}

      <section className="pb-20" aria-labelledby="form-title">
        <div className="container grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 id="form-title" data-reveal className={h2}>{sec("contact.form").title}</h2>
            {sec("contact.form").body && <p data-reveal className="mt-3 text-lg font-semibold text-ink-mute">{sec("contact.form").body}</p>}
            <div id="visit" data-reveal className="mt-8 scroll-mt-28 rounded-4xl bg-ink p-6 text-white">
              <p className="flex items-center gap-2 font-display text-xl font-extrabold"><Clock className="h-5 w-5 text-sun-400" />{sec("contact.visit").title}</p>
              <ul className="mt-4 grid gap-2">{site.serviceTimes.map((s) => <li key={s.label} className="flex justify-between gap-4 border-b border-white/10 pb-2 last:border-0"><span className="text-white/75">{s.label}</span><b>{s.time}</b></li>)}</ul>
              {c.hours && <p className="mt-3 text-sm font-semibold text-white/70">Office: {c.hours}</p>}
              {sec("contact.visit").body && <p className="mt-3 text-sm font-semibold text-sun-300">{sec("contact.visit").body}</p>}
            </div>
            <div data-reveal className="mt-4 flex items-center gap-4 rounded-4xl bg-sun-100 p-4">
              <div className="shrink-0 rounded-2xl bg-white p-1.5 ring-2 ring-ink/10"><QrBlock app={site.app} size={88} /></div>
              <div>
                <p className="font-display text-lg font-extrabold">{sec("contact.app").title || "Scan to download"}</p>
                <p className="text-sm font-semibold text-ink-mute">{site.app.qrCaption || sec("contact.app").body}</p>
              </div>
            </div>
          </div>
          <div data-reveal><ContactForm /></div>
        </div>
      </section>

      <section className="pb-20" aria-labelledby="social-title">
        <div className="container">
          <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <h2 id="social-title" data-split className={h2}>{sec("contact.social").title}</h2>
            {sec("contact.social").body && <p data-reveal className="max-w-md text-lg font-semibold text-ink-mute">{sec("contact.social").body}</p>}
          </div>
          <SocialGrid links={site.socials} />
          {embeds.length > 0 && <div className="mt-10"><SocialEmbeds items={embeds.slice(0, 3)} /></div>}
        </div>
      </section>

      <section id="map" className="scroll-mt-28 pb-20" aria-label="Map">
        <div className="container" data-reveal><Map query={c.mapQuery} label={c.mapLabel || c.address[0]} embed={c.mapEmbed} zoom={c.mapZoom} title={sec("contact.map").title} /></div>
      </section>

      <section className="bg-white py-16 md:py-20" aria-labelledby="nl-title">
        <div className="container grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <h2 id="nl-title" data-reveal className={h2}>{nl.title}</h2>
            <p data-reveal className="mt-3 text-lg font-semibold text-ink-mute">{nl.body}</p>
          </div>
          <div data-reveal><Newsletter variant="inline" thanks={nl.thanks} button={nl.button} /></div>
        </div>
      </section>
    </>
  );
}
