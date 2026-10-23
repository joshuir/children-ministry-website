import { requireAdmin } from "@/lib/cms/auth";
import { deleteFile, listFiles } from "@/lib/cms/store";
import { bad, body } from "@/lib/cms/http";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await requireAdmin();
  if (s instanceof Response) return s;
  const files = (await listFiles("media/")).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  return Response.json({ files }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(req: Request) {
  const s = await requireAdmin(req);
  if (s instanceof Response) return s;
  const b = await body<{ urls?: string[]; url?: string }>(req);
  const urls = (b?.urls || (b?.url ? [b.url] : [])).filter((u) => typeof u === "string" && /(^\/api\/files\/media\/|\.blob\.vercel-storage\.com\/media\/)/.test(u));
  if (!urls.length) return bad("Nothing to delete.");
  await Promise.all(urls.map((u) => deleteFile(u)));
  return Response.json({ ok: true, deleted: urls.length });
}
