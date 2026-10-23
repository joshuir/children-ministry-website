import { randomUUID } from "node:crypto";
import { mutateEngagement } from "@/lib/cms/data";
import { getPosts } from "@/lib/content";
import { bad, body, clean, hasPersonalInfo, rateLimit } from "@/lib/cms/http";

/** Parent comments are held for moderation before they appear on the feed. */
export async function POST(req: Request) {
  const b = await body<{ postId: string; parentId?: string; author: string; body: string; website?: string; t?: number }>(req);
  if (!b) return bad("Bad request.");
  if (b.website) return Response.json({ ok: true, status: "pending" }); // honeypot
  if (!rateLimit(req, "comment", 5, 10 * 60_000)) return bad("You've commented a lot just now — please try again in a few minutes.", 429);
  const author = clean(b.author, 60), text = clean(b.body, 800);
  if (author.length < 2) return bad("Please add your first name.");
  if (text.length < 2) return bad("Please write a comment.");
  if (hasPersonalInfo(text) || hasPersonalInfo(author)) return bad("For children's safety, please don't share phone numbers, emails or addresses in comments.");
  const posts = await getPosts();
  if (!posts.some((p) => p.id === b.postId)) return bad("Post not found.", 404);
  const id = "pc-" + randomUUID().slice(0, 12);
  const createdAt = new Date().toISOString();
  await mutateEngagement((e) => {
    e.comments.push({ id, postId: b.postId, parentId: clean(b.parentId, 40) || undefined, author: author.includes("(") ? author : `${author} (parent)`, body: text, createdAt, status: "pending" });
    if (e.comments.length > 5000) e.comments = e.comments.slice(-5000);
  });
  return Response.json({ ok: true, id, status: "pending", createdAt });
}
