import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/nunito-sans";
import "@fontsource/instrument-serif/latin-400.css";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Motion } from "@/components/Motion";
import { Cursor } from "@/components/Cursor";
import { Intro } from "@/components/Intro";
import { introBoot } from "@/lib/intro";
import { getClasses, getGroups, getPages, getSite, getTypography } from "@/lib/content";
import { fontHref, typographyCss } from "@/lib/typography";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSite();
  let base: URL;
  try { base = new URL(s.url); } catch { base = new URL("https://example.org"); }
  return {
    metadataBase: base,
    title: { default: `${s.name} — ${s.tagline}`, template: `%s · ${s.shortName}` },
    description: s.description,
    applicationName: s.name,
    openGraph: { type: "website", siteName: s.name, locale: "en_GB" },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = { themeColor: "#2563EB", width: "device-width", initialScale: 1 };

// Hides reveal targets until GSAP is ready; always reveals within 2.5s even if scripts fail.
const motionBoot = `(function(){try{var d=document.documentElement;if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){d.classList.add('motion-pending');setTimeout(function(){if(!window.__motionReady)d.classList.remove('motion-pending')},2500)}}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [site, groups, pages, type, classes] = await Promise.all([getSite(), getGroups(), getPages(), getTypography(), getClasses()]);
  const fonts = fontHref(type);
  const loader = pages.loader;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Church",
    name: site.church,
    department: { "@type": "Organization", name: site.name, description: site.description },
    url: site.url,
    telephone: site.contact.phone,
    email: site.contact.email,
    address: { "@type": "PostalAddress", streetAddress: site.contact.address[1], addressLocality: "Accra", addressCountry: "GH" },
    sameAs: site.socials.map((s) => s.url),
  };

  return (
    <html lang="en-GB" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionBoot }} />
        {loader.enabled && <script dangerouslySetInnerHTML={{ __html: introBoot(!!loader.everyVisit) }} />}
        <style id="cms-type" dangerouslySetInnerHTML={{ __html: typographyCss(type) }} />
        {fonts && <><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" /><link rel="stylesheet" href={fonts} /></>}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="flex min-h-screen flex-col">
        {loader.enabled && <Intro words={loader.words} tagline={loader.tagline || site.shortName} />}
        <div id="scroll-progress" aria-hidden className="fixed inset-x-0 top-0 z-[60] h-1 origin-left scale-x-0 bg-gradient-to-r from-brand-500 via-sun-400 to-coral-400" />
        <a href="#main" className="skip-link rounded-full bg-ink px-5 py-3 font-semibold text-white">Skip to content</a>
        <Navbar site={site} groups={groups} classes={classes.map(({ id, name, group, ages }) => ({ id, name, group, ages }))} />
        <main id="main" className="flex flex-1 flex-col">{children}</main>
        <Footer site={site} groups={groups} visit={pages.sections["footer.visit"]} />
        <Motion />
        <Cursor />
      </body>
    </html>
  );
}
