import { getLiveFeed } from "@/lib/cms/feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const { posts, updatedAt } = await getLiveFeed();
  return Response.json({ posts, updatedAt, now: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
