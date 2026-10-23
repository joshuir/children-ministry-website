import { addSubscriber } from "@/lib/cms/data";
import { EMAIL, bad, body, clean, rateLimit } from "@/lib/cms/http";

export async function POST(req: Request) {
  const b = await body<Record<string, string>>(req);
  if (!b) return bad("Bad request.");
  if (b.website) return Response.json({ ok: true });
  if (!rateLimit(req, "subscribe", 4, 10 * 60_000)) return bad("Too many requests — please try again later.", 429);
  const email = clean(b.email, 120);
  if (!EMAIL.test(email)) return bad("That email doesn't look quite right.");
  const r = await addSubscriber({ email, name: clean(b.name, 80) || undefined, source: clean(b.source, 40) || "website" });
  return Response.json({ ok: true, count: r.count, existing: r.existing });
}
