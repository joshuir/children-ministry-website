import type { EventItem } from "@/lib/types";

/** Accra is UTC+0 all year, so local times map straight to UTC. */
function parseClock(s: string): number | null {
  const m = s.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  return h * 60 + min;
}

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (iso: string) => iso.slice(0, 10).replace(/-/g, "");
const addDays = (iso: string, d: number) => {
  const t = new Date(iso.slice(0, 10) + "T12:00:00Z");
  t.setUTCDate(t.getUTCDate() + d);
  return t.toISOString().slice(0, 10);
};

export function eventTimes(e: Pick<EventItem, "date" | "endDate" | "time">) {
  // "9:00 am", "2:00 – 5:00 pm", "10am-12pm"
  const parts = (e.time || "").split(/\s*[–—-]\s*|\s+to\s+/i);
  const suffix = parts[1]?.match(/(am|pm)\s*$/i)?.[1] || "";
  const start = parseClock(parts[0] + (/(am|pm)$/i.test(parts[0]) ? "" : " " + suffix));
  const end = parts[1] ? parseClock(parts[1]) : null;
  const endDay = e.endDate || e.date;
  if (start == null) return { allDay: true as const, startDate: ymd(e.date), endDate: ymd(addDays(endDay, 1)) };
  const finish = end != null && end > start ? end : start + 120;
  const toUtc = (day: string, mins: number) => `${ymd(day)}T${pad(Math.floor(mins / 60))}${pad(mins % 60)}00Z`;
  return { allDay: false as const, startUtc: toUtc(e.date, start), endUtc: toUtc(endDay, finish) };
}

export function googleCalendarUrl(e: EventItem, address: string) {
  const t = eventTimes(e);
  const dates = t.allDay ? `${t.startDate}/${t.endDate}` : `${t.startUtc}/${t.endUtc}`;
  const q = new URLSearchParams({ action: "TEMPLATE", text: e.title, dates, details: e.summary, location: `${e.location}, ${address}`, ctz: "Africa/Accra" });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export const EVENT_CATEGORIES: { id: NonNullable<EventItem["category"]>; label: string }[] = [
  { id: "service", label: "Services" },
  { id: "special", label: "Special days" },
  { id: "family", label: "Family" },
  { id: "outreach", label: "Outreach" },
  { id: "camp", label: "Camps & trips" },
  { id: "training", label: "Teacher training" },
];

export type SyncTarget = "google" | "apple" | "outlook" | "copy";

/**
 * One-click subscription links for the whole calendar feed. Subscribing (rather than downloading
 * a file) means events the ministry adds or edits in the content manager appear automatically.
 */
export function syncLinks(host: string, name: string) {
  const https = `https://${host}/api/calendar`;
  const webcal = `webcal://${host}/api/calendar`;
  return {
    google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`,
    apple: webcal,
    outlook: `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(https)}&name=${encodeURIComponent(name)}`,
    feed: https,
  };
}

/** Short label for a category, used under the compact event icons. */
export const categoryLabel = (id?: EventItem["category"]) => EVENT_CATEGORIES.find((c) => c.id === (id || "special"))?.label ?? "Event";
