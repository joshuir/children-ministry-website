import { mutateEngagement } from "@/lib/cms/data";
import { getPosts } from "@/lib/content";
import { bad, body, rateLimit } from "@/lib/cms/http";
import type { Reaction } from "@/lib/types";

const KEYS: Reaction[] = ["love", "laugh", "wow", "pray", "like"];

/** Add or remove one reaction. Body: { postId, reaction, on, previous? } */
export async function POST(req: Request) {
  if (!rateLimit(req, "react", 40, 60_000)) return bad("Slow down a little 🙂", 429);
  const b = await body<{ postId: string; reaction: Reaction; on: boolean; previous?: Reaction | null }>(req);
  if (!b || !KEYS.includes(b.reaction) || (b.previous && !KEYS.includes(b.previous))) return bad("Bad reaction.");
  const post = (await getPosts()).find((p) => p.id === b.postId);
  if (!post) return bad("Post not found.", 404);
  const e = await mutateEngagement((e) => {
    const r = (e.reactions[post.id] ||= {});
    if (b.previous && b.previous !== b.reaction) r[b.previous] = (r[b.previous] || 0) - 1;
    r[b.reaction] = (r[b.reaction] || 0) + (b.on ? 1 : -1);
  });
  const d = e.reactions[post.id] || {};
  const reactions = Object.fromEntries(KEYS.map((k) => [k, Math.max(0, (post.reactions[k] || 0) + (d[k] || 0))]));
  return Response.json({ ok: true, reactions });
}
