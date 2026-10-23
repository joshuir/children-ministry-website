import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { getSite } from "@/lib/content";

export const metadata: Metadata = { title: "Accessibility", description: "Our commitment to making Children's Ministry accessible to every family.", alternates: { canonical: "/accessibility/" } };

export default async function Page() {
  const site = await getSite();
  return (
    <LegalPage eyebrow="Accessibility" tone="lilac" title="A website for every family" updated="1 October 2026"
      intro="We want every parent, carer and child to be able to use this site, whatever device or assistive technology they use."
      sections={[
        { h: "What we've done", p: [["We aim to meet WCAG 2.2 level AA.", "Text and controls meet colour-contrast guidelines, with large, readable type.", "Everything works with a keyboard, with clear focus indicators and a skip link.", "Images have text alternatives, and forms have labels and clear error messages.", "Animations are switched off automatically if your device asks for reduced motion.", "Buttons and links are at least 44 pixels tall for easy tapping."]] },
        { h: "At church", p: ["Our children's wing is step-free, and we're happy to talk about any additional needs your child has so we can support them well in class."] },
        { h: "Tell us if something doesn't work", p: [`If you find something hard to use, please email ${site.contact.email} or message us on WhatsApp — we'll fix it.`] },
      ]} />
  );
}
