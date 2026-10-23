
export type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+()\d\s-]{7,20}$/;

export const validators = {
  required: (v: string, label: string) => (v.trim() ? undefined : `Please enter your ${label}.`),
  email: (v: string) => (!v.trim() ? "Please enter your email address." : EMAIL.test(v.trim()) ? undefined : "That email doesn't look quite right."),
  phone: (v: string) => (!v.trim() || PHONE.test(v.trim()) ? undefined : "Use digits, spaces and + only."),
  min: (v: string, n: number, label: string) => (v.trim().length >= n ? undefined : `${label} needs at least ${n} characters.`),
  max: (v: string, n: number, label: string) => (v.length <= n ? undefined : `${label} must be under ${n} characters.`),
};

/** Strips control characters and trims — the database applies the same rules again. */
export const clean = (v: string, max = 2000) => v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);

/**
 * Bot defence used by every public form:
 *  - a hidden honeypot field humans never fill;
 *  - a minimum time between page load and submit;
 *  - a per-browser cooldown (the database enforces the real rate limit).
 */
export function spamCheck(form: HTMLFormElement, openedAt: number, key: string): string | undefined {
  const trap = (form.elements.namedItem("website") as HTMLInputElement | null)?.value;
  if (trap) return "spam";
  if (Date.now() - openedAt < 2500) return "Please take a moment before sending.";
  try {
    const last = Number(sessionStorage.getItem(`cooldown:${key}`) || 0);
    if (Date.now() - last < 30_000) return "You've just sent one — please wait 30 seconds before sending again.";
  } catch { /* storage unavailable: rely on server-side limits */ }
  return undefined;
}

export function markSent(key: string) {
  try { sessionStorage.setItem(`cooldown:${key}`, String(Date.now())); } catch { /* ignore */ }
}

/** Sends a public form to the site's API (stored in the CMS inbox / subscriber list). */
export async function submitRpc(fn: "submit_contact" | "subscribe_newsletter", args: Record<string, string>) {
  const url = fn === "submit_contact" ? "/api/contact" : "/api/subscribe";
  const map: Record<string, string> = { p_name: "name", p_email: "email", p_phone: "phone", p_topic: "topic", p_subject: "topic", p_message: "message" };
  const payload = Object.fromEntries(Object.entries(args).map(([k, v]) => [map[k] || k.replace(/^p_/, ""), v]));
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (res.ok) { const j = await res.json().catch(() => ({})); return { ok: true as const, preview: false, data: j as Record<string, unknown> }; }
    const j = await res.json().catch(() => ({}));
    return { ok: false as const, message: j.error || "Something went wrong. Please try again or contact us on WhatsApp." };
  } catch {
    return { ok: false as const, message: "You seem to be offline. Please try again in a moment." };
  }
}
