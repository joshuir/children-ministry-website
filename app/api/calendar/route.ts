import { getEvents, getSite } from "@/lib/content";
import { eventTimes } from "@/lib/calendar";

// Always fresh: calendar apps re-poll this feed, and CMS edits must show up without waiting for a rebuild.
export const dynamic = "force-dynamic";

// RFC 5545 text escaping. (The old version wrote "\;", which is just ";" in JS, so semicolons broke events.)
const esc = (s: string) => (s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line: string) => line.match(/.{1,73}/g)!.join("\r\n ");

/** iCalendar feed of all events (subscribe from any calendar app), or one event with ?id= */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  const [events, site] = await Promise.all([getEvents(), getSite()]);
  const list = id ? events.filter((e) => e.id === id) : events;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Childrens Ministry//Events//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${esc(site.shortName)} events`, "X-WR-TIMEZONE:Africa/Accra", "REFRESH-INTERVAL;VALUE=DURATION:PT1H", "X-PUBLISHED-TTL:PT1H"];
  for (const e of list) {
    const t = eventTimes(e);
    lines.push("BEGIN:VEVENT", `UID:${e.id}@childrens-ministry`, `DTSTAMP:${stamp}`);
    if (t.allDay) lines.push(`DTSTART;VALUE=DATE:${t.startDate}`, `DTEND;VALUE=DATE:${t.endDate}`);
    else lines.push(`DTSTART:${t.startUtc}`, `DTEND:${t.endUtc}`);
    lines.push(`LAST-MODIFIED:${stamp}`, `SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(e.summary)}`, `LOCATION:${esc(e.location + ", " + site.contact.address.join(", "))}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return new Response(lines.map(fold).join("\r\n"), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `${id ? "attachment" : "inline"}; filename="${id || "events"}.ics"`, "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300" },
  });
}
