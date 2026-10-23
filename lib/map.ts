/**
 * Turns whatever an editor pastes into the CMS into a map that can be shown on the site:
 *  - the whole <iframe> code from Google Maps → Share → Embed a map
 *  - a normal Google Maps link copied from the address bar (…/maps/place/… or …/@5.56,-0.2,15z)
 *  - coordinates like "5.5600, -0.2050"
 *  - OpenStreetMap or Bing embed links
 * Anything else falls back to a Google Maps search for the "map search" text.
 */
export type MapSource = { src: string; kind: "embed" | "link" | "coords" | "search"; note?: string };

const embedFor = (q: string, zoom: number) => `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`;

export function resolveMap(raw: string | undefined, query: string, zoom = 15): MapSource {
  const z = Math.min(20, Math.max(3, Math.round(Number(zoom) || 15)));
  const input = (raw || "").trim();
  if (input) {
    const coords = input.match(/^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/);
    if (coords) return { src: embedFor(`${coords[1]},${coords[2]}`, z), kind: "coords" };
    const m = input.match(/src=["']([^"']+)["']/i);
    let url = (m ? m[1] : input).replace(/&amp;/g, "&");
    if (!/^[a-z]+:\/\//i.test(url) && /^(www\.)?(google\.|maps\.app\.goo\.gl|goo\.gl)/i.test(url)) url = `https://${url}`;
    try {
      const u = new URL(url);
      if (u.protocol === "https:") {
        const google = /(^|\.)google\.[a-z.]+$/.test(u.hostname) && u.pathname.startsWith("/maps");
        if (google && (u.pathname.startsWith("/maps/embed") || u.searchParams.get("output") === "embed")) return { src: u.toString(), kind: "embed" };
        if (/(^|\.)openstreetmap\.org$/.test(u.hostname) || /(^|\.)bing\.com$/.test(u.hostname)) return { src: u.toString(), kind: "embed" };
        if (google) {
          const at = u.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)(?:,(\d+(?:\.\d+)?)z)?/);
          const place = u.pathname.match(/\/place\/([^/]+)/);
          const q = u.searchParams.get("q") || u.searchParams.get("query");
          const pin = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/); // the exact pin inside place links
          if (pin) return { src: embedFor(`${pin[1]},${pin[2]}`, z), kind: "link" };
          if (place) return { src: embedFor(decodeURIComponent(place[1].replace(/\+/g, " ")), z), kind: "link" };
          if (at) return { src: embedFor(`${at[1]},${at[2]}`, at[3] ? Number(at[3]) : z), kind: "link" };
          if (q) return { src: embedFor(q, z), kind: "link" };
        }
        if (/goo\.gl$|maps\.app\.goo\.gl$/.test(u.hostname)) {
          return { src: embedFor(query, z), kind: "search", note: "Short share links (maps.app.goo.gl) can't be shown. Open the link, then copy the long address from your browser bar — or use Share → Embed a map." };
        }
      }
    } catch { /* not a URL */ }
    return { src: embedFor(query, z), kind: "search", note: "That map link wasn't recognised, so the map search below is used instead." };
  }
  return { src: embedFor(query, z), kind: "search" };
}
