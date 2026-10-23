import { requireAdmin } from "@/lib/cms/auth";
import { getEngagement, mutateEngagement } from "@/lib/cms/data";
import { bad, body } from "@/lib/cms/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireAdmin();
  if (s instanceof Response) return s;
  return Response.json(await getEngagement(0), { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: Request) {
  const s = await requireAdmin(req);
  if (s instanceof Response) return s;
  const b = await body<{ ids: string[]; status?: "approved" | "rejected" | "pending"; remove?: boolean; resetReactions?: string }>(req);
  if (!b) return bad("Bad request.");
  const data = await mutateEngagement((e) => {
    if (b.resetReactions) delete e.reactions[b.resetReactions];
    const ids = new Set(b.ids || []);
    if (b.remove) e.comments = e.comments.filter((c) => !ids.has(c.id) && !ids.has(c.parentId || ""));
    else if (b.status) e.comments.forEach((c) => { if (ids.has(c.id)) c.status = b.status!; });
  });
  return Response.json(data);
}
