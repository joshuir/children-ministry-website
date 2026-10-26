import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/nunito-sans";
import "@fontsource/instrument-serif/latin-400.css";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Motion } from "@/components/Motion";
import { CookieConsent } from "@/components/CookieConsent";
import { Cursor } from "@/components/Cursor";
import { getClasses, getGroups, getMotion, getPages, getSite, getTypography } from "@/lib/content";
import { fontHref, typographyCss } from "@/lib/typography";
import { motionBootScript } from "@/lib/motion-pref";

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

// 1. Netlify injects "\n<!-- This site is hosted on Netlify… -->" right after <meta charset>. React skips
//    the comment but not the newline text node, so hydration failed (error #418) and React rebuilt the
//    whole document — reverting every GSAP animation and wiping <html> classes. Strip both before React
//    hydrates (React never renders text or comments directly inside <html>/<head>).
// 2. Decides full vs calm motion before paint (see lib/motion-pref.ts) and hides reveal targets until
//    GSAP is ready; they always appear within 2.5s even if scripts fail.
const motionBoot = `(function(){try{[document.documentElement,document.head].forEach(function(n){for(var c=n.firstChild;c;){var x=c.nextSibling;if(c.nodeType===8||(c.nodeType===3&&!/\\S/.test(c.data)))n.removeChild(c);c=x}})}catch(e){}})();`;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [site, groups, pages, type, classes, motion] = await Promise.all([getSite(), getGroups(), getPages(), getTypography(), getClasses(), getMotion()]);
  const fonts = fontHref(type);
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
        <script dangerouslySetInnerHTML={{ __html: motionBoot + motionBootScript(motion.mode) }} />
        <style id="cms-type" dangerouslySetInnerHTML={{ __html: typographyCss(type) }} />
        {fonts && <><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" /><link rel="stylesheet" href={fonts} /></>}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="flex min-h-screen flex-col">
        <div id="scroll-progress" aria-hidden className="fixed inset-x-0 top-0 z-[60] h-1 origin-left scale-x-0 bg-gradient-to-r from-brand-500 via-sun-400 to-coral-400" />
        <a href="#main" className="skip-link rounded-full bg-ink px-5 py-3 font-semibold text-white">Skip to content</a>
        {/* One hydration pass, no Suspense boundaries here: <Motion> rewrites text (count-ups, word splits), so it
            must run only after every section has hydrated. Deferred boundaries caused React #418 text mismatches. */}
        <Navbar site={site} groups={groups} classes={classes.map(({ id, name, group, ages }) => ({ id, name, group, ages }))} />
        <main id="main" className="flex flex-1 flex-col">{children}</main>
        <Footer site={site} groups={groups} visit={pages.sections["footer.visit"]} />
        <Motion />
        <CookieConsent />
        <Cursor />
      </body>
    </html>
  );
}
