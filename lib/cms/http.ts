import "server-only";

const buckets = new Map<string, number[]>();

/** Best-effort per-instance rate limit (serverless instances each keep their own window). */
export function rateLimit(req: Request, key: string, max: number, windowMs: number) {
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const id = key + ":" + ip;
  const now = Date.now();
  const hits = (buckets.get(id) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) return false;
  hits.push(now);
  buckets.set(id, hits);
  if (buckets.size > 5000) buckets.clear();
  return true;
}

export const clean = (v: unknown, max = 2000) =>
  typeof v === "string" ? v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max) : "";

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Blocks personal contact details in public comments (child-safety rule). */
export function hasPersonalInfo(text: string) {
  return /[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(text) || /(\+?\d[\d\s().-]{7,}\d)/.test(text) || /\b(house|plot|street|st\.|avenue|road)\s*(no\.?|number)?\s*\d+/i.test(text);
}

export const bad = (error: string, status = 400) => Response.json({ error }, { status });

export async function body<T = any>(req: Request): Promise<T | null> {
  try { return (await req.json()) as T; } catch { return null; }
}
