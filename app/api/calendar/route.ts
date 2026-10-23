import { getEvents, getSite } from "@/lib/content";
import { eventTimes } from "@/lib/calendar";

export const revalidate = 300;

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const fold = (line: string) => line.match(/.{1,73}/g)!.join("\r\n ");

/** iCalendar feed of all events (subscribe in Google/Apple Calendar), or one event with ?id= */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  const [events, site] = await Promise.all([getEvents(), getSite()]);
  const list = id ? events.filter((e) => e.id === id) : events;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Childrens Ministry//Events//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${esc(site.shortName)} events`, "X-WR-TIMEZONE:Africa/Accra"];
  for (const e of list) {
    const t = eventTimes(e);
    lines.push("BEGIN:VEVENT", `UID:${e.id}@childrens-ministry`, `DTSTAMP:${stamp}`);
    if (t.allDay) lines.push(`DTSTART;VALUE=DATE:${t.startDate}`, `DTEND;VALUE=DATE:${t.endDate}`);
    else lines.push(`DTSTART:${t.startUtc}`, `DTEND:${t.endUtc}`);
    lines.push(`SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(e.summary)}`, `LOCATION:${esc(e.location + ", " + site.contact.address.join(", "))}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return new Response(lines.map(fold).join("\r\n"), {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `${id ? "attachment" : "inline"}; filename="${id || "events"}.ics"` },
  });
}
