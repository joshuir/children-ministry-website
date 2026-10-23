import { addInbox } from "@/lib/cms/data";
import { EMAIL, bad, body, clean, rateLimit } from "@/lib/cms/http";

export async function POST(req: Request) {
  const b = await body<Record<string, string>>(req);
  if (!b) return bad("Bad request.");
  if (b.website) return Response.json({ ok: true });
  if (!rateLimit(req, "contact", 4, 10 * 60_000)) return bad("Too many messages — please try again later.", 429);
  const name = clean(b.name, 80), email = clean(b.email, 120), message = clean(b.message, 3000);
  if (name.length < 2 || !EMAIL.test(email) || message.length < 10) return bad("Please check the form and try again.");
  await addInbox({ kind: "contact", name, email, phone: clean(b.phone, 30), topic: clean(b.topic, 60), message });
  return Response.json({ ok: true });
}
