import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getSession, requireAdmin } from "@/lib/cms/auth";
import { putFile, blobMode, netlifyMode } from "@/lib/cms/store";
import { bad } from "@/lib/cms/http";

export const dynamic = "force-dynamic";

const ALLOWED = ["image/*", "video/*", "audio/*", "application/pdf", "application/json", "text/plain", "text/csv",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];

const safeName = (n: string) => n.toLowerCase().replace(/[^a-z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-80) || "file";

export async function POST(req: Request) {
  // Production: direct browser → Blob upload (no size limit from the function). We only issue the token.
  if (blobMode() && req.headers.get("content-type")?.includes("application/json")) {
    const b = (await req.json()) as HandleUploadBody;
    try {
      const json = await handleUpload({
        body: b,
        request: req,
        onBeforeGenerateToken: async (pathname) => {
          const s = await getSession();
          if (!s) throw new Error("Please sign in again.");
          if (!pathname.startsWith("media/")) throw new Error("Bad upload path.");
          return { allowedContentTypes: ALLOWED, maximumSizeInBytes: 500 * 1024 * 1024, addRandomSuffix: true, tokenPayload: JSON.stringify({ by: s.name }) };
        },
        onUploadCompleted: async () => {},
      });
      return Response.json(json);
    } catch (e: any) {
      return bad(e?.message || "Upload failed.", 400);
    }
  }
  // Local / fallback: multipart form upload through the server.
  const s = await requireAdmin(req);
  if (s instanceof Response) return s;
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return bad("No file received.");
  if (netlifyMode() && file.size > 5.5 * 1024 * 1024) return bad("Files must be under 5.5 MB on this host. Compress the file, or link larger videos from YouTube.");
  if (file.size > 50 * 1024 * 1024) return bad("Files over 50 MB need the production uploader.");
  const folder = String(form?.get("folder") || "uploads").replace(/[^a-z0-9-]/gi, "");
  const saved = await putFile(`media/${folder}/${safeName(file.name)}`, Buffer.from(await file.arrayBuffer()), file.type);
  return Response.json({ ...saved, size: file.size, contentType: file.type });
}
