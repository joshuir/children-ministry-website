import { readLocalFile, blobMode } from "@/lib/cms/store";

const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", svg: "image/svg+xml", avif: "image/avif", mp4: "video/mp4", webm: "video/webm", mov: "video/quicktime", mp3: "audio/mpeg", m4a: "audio/mp4", wav: "audio/wav", pdf: "application/pdf", json: "application/json" };

/** Serves files uploaded in local development (production uses Vercel Blob URLs directly). */
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (blobMode() || path[0] !== "media") return new Response("Not found", { status: 404 });
  const rel = path.join("/");
  const buf = await readLocalFile(rel);
  if (!buf) return new Response("Not found", { status: 404 });
  const ext = rel.split(".").pop()!.toLowerCase();
  const headers: Record<string, string> = { "Content-Type": TYPES[ext] || "application/octet-stream", "X-Content-Type-Options": "nosniff" };
  if (ext === "svg") headers["Content-Security-Policy"] = "script-src 'none'";
  headers["Cache-Control"] = "public, max-age=31536000, immutable";
  if (new URL(req.url).searchParams.has("download")) headers["Content-Disposition"] = `attachment; filename="${path[path.length - 1]}"`;
  return new Response(new Uint8Array(buf), { headers });
}
