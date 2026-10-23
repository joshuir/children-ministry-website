import { addInbox } from "@/lib/cms/data";
import { bad, body, clean, rateLimit } from "@/lib/cms/http";

export async function POST(req: Request) {
  if (!rateLimit(req, "report", 10, 10 * 60_000)) return bad("Too many reports — please try later.", 429);
  const b = await body<{ postId?: string; commentId?: string; reason?: string }>(req);
  if (!b?.postId) return bad("Missing post.");
  await addInbox({ kind: "report", topic: "Reported content", message: clean(b.reason, 500) || "Reported from the feed", meta: { postId: clean(b.postId, 40), commentId: clean(b.commentId, 40) } });
  return Response.json({ ok: true });
}
