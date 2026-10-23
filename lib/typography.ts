import type { Typography } from "@/lib/types";
import { BUNDLED_FONTS } from "@/content/pages";

const clamp = (n: unknown, lo: number, hi: number, d: number) => {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;
};
const safeName = (s: string) => String(s || "").replace(/[^A-Za-z0-9 ]/g, "").trim();

function stack(name: string) {
  const n = safeName(name);
  if (!n) return "";
  return BUNDLED_FONTS.has(n) ? `"${n} Variable", "${n}"` : `"${n}"`;
}

/** CSS custom properties for the editable typography (applied on :root). */
export function typographyCss(t: Typography) {
  const display = stack(t.displayFont) || '"Bricolage Grotesque Variable"';
  const body = stack(t.bodyFont) || '"Nunito Sans Variable"';
  return `:root{--font-display:${display};--font-body:${body};--body-size:${clamp(t.baseSize, 14, 24, 18)}px;--body-weight:${clamp(t.bodyWeight, 300, 800, 500)};--heading-weight:${clamp(t.headingWeight, 400, 900, 800)};--h-scale:${clamp(t.headingScale, 0.7, 1.5, 1)};--h-case:${t.headingCase === "uppercase" ? "uppercase" : "none"};--h-track:${clamp(t.letterSpacing, -0.08, 0.1, -0.02)}em}`;
}

const AXES: Record<string, string> = {
  "Baloo 2": "400..800", Fredoka: "300..700", Poppins: "400;500;600;700;800;900", Montserrat: "300..900", Inter: "300..900",
  Lexend: "300..900", Outfit: "300..900", Sora: "300..800", "DM Sans": "300..900", Quicksand: "300..700",
  "Plus Jakarta Sans": "300..800", Archivo: "300..900", Manrope: "300..800", Raleway: "300..900",
};

/** Google Fonts stylesheet for any chosen font that isn't bundled with the site. */
export function fontHref(t: Typography) {
  const fams = [t.displayFont, t.bodyFont].map(safeName).filter((f, i, a) => f && !BUNDLED_FONTS.has(f) && a.indexOf(f) === i);
  if (!fams.length) return null;
  return "https://fonts.googleapis.com/css2?" + fams.map((f) => `family=${f.replace(/ /g, "+")}:wght@${AXES[f] || "400;700"}`).join("&") + "&display=swap";
}
