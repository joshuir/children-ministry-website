import { requireAdmin } from "@/lib/cms/auth";
import { getContentForEdit, saveContent } from "@/lib/cms/data";
import { validate } from "@/lib/cms/schema";
import { ConflictError, blobMode } from "@/lib/cms/store";
import { bad, body } from "@/lib/cms/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireAdmin();
  if (s instanceof Response) return s;
  const { content, etag } = await getContentForEdit();
  return Response.json({ content, etag, storage: blobMode() ? "blob" : "local", user: s.name }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(req: Request) {
  const s = await requireAdmin(req);
  if (s instanceof Response) return s;
  const b = await body<{ content: any; etag: string | null }>(req);
  if (!b?.content) return bad("Nothing to save.");
  const err = validate(b.content);
  if (err) return bad(err);
  try {
    const saved = await saveContent(b.content, b.etag ?? null, s.name);
    return Response.json({ ok: true, etag: saved.etag, updatedAt: saved.content.updatedAt });
  } catch (e) {
    if (e instanceof ConflictError) {
      const latest = await getContentForEdit();
      return Response.json({ error: "Someone else saved changes while you were editing.", latest }, { status: 409 });
    }
    console.error(e);
    return bad("Couldn't save — please try again.", 500);
  }
}
