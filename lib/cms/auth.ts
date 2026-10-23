import "server-only";
import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { authSecret, currentAccount, safeEqual, type Account, type Role } from "./staff";

/**
 * Content-manager sessions.
 *  - Sign-in needs a valid username AND password (see lib/cms/staff.ts).
 *  - The session is an HMAC-signed, HTTP-only, Secure, SameSite cookie (signed with AUTH_SECRET).
 *  - Every request re-checks the account: removing a person, disabling them or resetting
 *    their password ends their sessions immediately.
 *  - If AUTH_SECRET is missing in production, no session is ever accepted (fails closed).
 */
const PROD = process.env.NODE_ENV === "production";
export const COOKIE = PROD ? "__Host-cm_session" : "cm_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

export interface Session { username: string; name: string; role: Role }

const sign = (v: string) => {
  const s = authSecret();
  return s ? createHmac("sha256", s).update("session:" + v).digest("base64url") : null;
};

export function makeToken(a: Account) {
  const payload = Buffer.from(JSON.stringify({ u: a.username, pv: a.pv, e: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return payload + "." + sign(payload);
}

async function readToken(token?: string | null): Promise<Session | null> {
  if (!token || token.length > 1000) return null;
  const [payload, sig] = token.split(".");
  const want = payload ? sign(payload) : null;
  if (!payload || !sig || !want || !safeEqual(sig, want)) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof d.e !== "number" || d.e < Date.now() || typeof d.u !== "string" || typeof d.pv !== "string") return null;
    const acc = await currentAccount(d.u, d.pv);
    return acc ? { username: acc.username, name: acc.name, role: acc.role } : null;
  } catch {
    return null;
  }
}

export async function getSession() {
  const jar = await cookies();
  return readToken(jar.get(COOKIE)?.value);
}

export const cookieOptions = { httpOnly: true, secure: PROD, sameSite: "strict" as const, path: "/", maxAge: MAX_AGE };

function crossSite(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return false;
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!origin) return req.headers.get("sec-fetch-site") === "cross-site";
  try { return !host || new URL(origin).host !== host; } catch { return true; }
}

/** Guard for API routes. Returns a 401/403 Response when the caller isn't a signed-in staff member. */
export async function requireAdmin(req?: Request): Promise<Session | Response> {
  if (req && crossSite(req)) return Response.json({ error: "Cross-site request blocked." }, { status: 403 });
  const s = await getSession();
  if (!s) return Response.json({ error: "Please sign in again." }, { status: 401 });
  return s;
}

/** Guard for owner-only actions (managing staff accounts). */
export async function requireOwner(req?: Request): Promise<Session | Response> {
  const s = await requireAdmin(req);
  if (s instanceof Response) return s;
  if (s.role !== "owner") return Response.json({ error: "Only the site owner can do that." }, { status: 403 });
  return s;
}

export { crossSite };
