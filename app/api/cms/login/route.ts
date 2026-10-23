import { NextResponse } from "next/server";
import { COOKIE, cookieOptions, crossSite, makeToken } from "@/lib/cms/auth";
import { authenticate, normUser } from "@/lib/cms/staff";
import { bad, body } from "@/lib/cms/http";

export const dynamic = "force-dynamic";

/**
 * Failed-attempt throttle (per server instance). Only FAILED sign-ins count, so a person
 * who signs in correctly is never slowed down, and limits are keyed to the caller's
 * network address so a stranger can't lock someone else out of their account.
 */
const WINDOW = 15 * 60_000;
const fails = new Map<string, number[]>();
const recent = (k: string) => (fails.get(k) || []).filter((t) => Date.now() - t < WINDOW);
const note = (k: string) => { fails.set(k, [...recent(k), Date.now()]); if (fails.size > 5000) fails.clear(); };

export async function POST(req: Request) {
  if (crossSite(req)) return bad("Cross-site request blocked.", 403);
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();
  const b = await body<{ username?: string; password?: string }>(req);
  const user = normUser(b?.username).slice(0, 40);
  const kIp = "ip:" + ip, kUser = "u:" + ip + ":" + user;
  if (recent(kIp).length >= 20 || recent(kUser).length >= 5) return bad("Too many failed sign-in attempts. Please wait 15 minutes and try again.", 429);

  const acc = b ? await authenticate(b.username, b.password) : null;
  if (!acc) {
    note(kIp); note(kUser);
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));
    return bad("That username and password don't match an account.", 401);
  }
  fails.delete(kUser);
  const res = NextResponse.json({ ok: true, name: acc.name });
  res.cookies.set(COOKIE, makeToken(acc), cookieOptions);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
