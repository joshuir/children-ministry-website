// "Sept" → "Sep": newer ICU (Node 22) and older browsers abbreviate September differently.
export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) =>
  new Date(iso + (iso.length === 10 ? "T12:00:00Z" : "")).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts }).replace(/\bSept\b/, "Sep");

/** Fixed short month names: ICU versions disagree ("Sep" vs "Sept"), which breaks hydration between server and browser. */
export const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const dayMonth = (iso: string) => {
  const d = new Date(iso.slice(0, 10) + "T12:00:00Z");
  return { day: d.getUTCDate(), month: MONTHS_SHORT[d.getUTCMonth()] };
};

export function timeAgo(iso: string, now = new Date()) {
  const s = Math.max(0, (now.getTime() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)}d`;
  return fmtDate(iso.slice(0, 10), { day: "numeric", month: "short" });
}

export const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n));

const WD_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WD_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** "Sat 17 Oct" / "Saturday 17 October" — built by hand so server and browser always agree (ICU output differs). */
export function dayLabel(iso: string, long = false) {
  const d = new Date(iso.slice(0, 10) + "T12:00:00Z");
  const wd = (long ? WD_LONG : WD_SHORT)[d.getUTCDay()];
  return `${wd} ${fmtDate(iso.slice(0, 10), { day: "numeric", month: long ? "long" : "short" })}`;
}
