import { requireAdmin } from "@/lib/cms/auth";
import { getContentForEdit, listVersions, readVersion, saveContent } from "@/lib/cms/data";
import { bad, body } from "@/lib/cms/http";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const s = await requireAdmin();
  if (s instanceof Response) return s;
  const id = new URL(req.url).searchParams.get("id");
  if (id) {
    const v = await readVersion(id);
    if (!v) return bad("Version not found.", 404);
    return new Response(JSON.stringify(v, null, 2), { headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="content-${id}.json"` } });
  }
  return Response.json({ versions: await listVersions() }, { headers: { "Cache-Control": "no-store" } });
}

/** Restore an old version (it becomes a new version, so restores can be undone too). */
export async function POST(req: Request) {
  const s = await requireAdmin(req);
  if (s instanceof Response) return s;
  const b = await body<{ id: string }>(req);
  const v = b?.id ? await readVersion(b.id) : null;
  if (!v) return bad("Version not found.", 404);
  const { etag } = await getContentForEdit();
  const saved = await saveContent(v, etag, s.name + " (restore)");
  return Response.json({ ok: true, content: saved.content, etag: saved.etag });
}
