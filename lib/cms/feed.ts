import "server-only";
import { getEngagement, type Engagement } from "./data";
import { getPosts, getTeachers } from "@/lib/content";
import type { Post, PostComment, Reaction } from "@/lib/types";

const KEYS: Reaction[] = ["love", "laugh", "wow", "pray", "like"];

export function mergeEngagement(posts: Post[], e: Engagement): Post[] {
  return posts.map((p) => {
    const d = e.reactions[p.id] || {};
    const reactions = Object.fromEntries(KEYS.map((k) => [k, Math.max(0, (p.reactions?.[k] || 0) + (d[k] || 0))])) as Record<Reaction, number>;
    const approved = e.comments.filter((c) => c.postId === p.id && c.status === "approved");
    const toComment = (c: (typeof approved)[number]): PostComment => ({ id: c.id, author: c.author, authorRole: "parent", body: c.body, createdAt: c.createdAt, likes: 0 });
    const base: PostComment[] = (p.comments || []).map((c) => ({ ...c, replies: [...(c.replies || []), ...approved.filter((a) => a.parentId === c.id).map(toComment)] }));
    const top = approved.filter((a) => !a.parentId || !base.some((b) => b.id === a.parentId)).map((a) => ({ ...toComment(a), replies: approved.filter((r) => r.parentId === a.id).map(toComment) }));
    return { ...p, reactions, comments: [...base, ...top].sort((a, b) => a.createdAt.localeCompare(b.createdAt)) };
  });
}

export async function getLiveFeed() {
  const [posts, e, teachers] = await Promise.all([getPosts(), getEngagement(), getTeachers()]);
  return { posts: mergeEngagement(posts, e), teachers, updatedAt: e.updatedAt };
}
