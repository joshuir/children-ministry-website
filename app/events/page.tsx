import type { Metadata } from "next";
import { CmsHero } from "@/components/ui";
import { EventsCalendar } from "@/components/EventsCalendar";
import { getEvents, getHeroText, getSite } from "@/lib/content";

export const metadata: Metadata = {
  title: "Events calendar",
  description: "Children's Ministry events: harvests, parents' days, camps, outreaches and Christmas — add any event to your calendar or subscribe to the whole feed.",
  alternates: { canonical: "/events/" },
};

export default async function EventsPage() {
  const [events, site, hero] = await Promise.all([getEvents(), getSite(), getHeroText("events")]);
  const jsonLd = events.map((e) => ({
    "@context": "https://schema.org", "@type": "Event", name: e.title, startDate: e.date, endDate: e.endDate || e.date, description: e.summary,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode", eventStatus: "https://schema.org/EventScheduled",
    location: { "@type": "Place", name: e.location, address: site.contact.address.join(", ") },
    organizer: { "@type": "Organization", name: site.name, url: site.url },
  }));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CmsHero hero={hero} tone="sun" />
      <section className="py-12 md:py-16" aria-label="Events calendar">
        <div className="container"><EventsCalendar events={events} address={site.contact.address.join(", ")} initialMonth={new Date().toISOString().slice(0, 7)} /></div>
      </section>
    </>
  );
}
