import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Storage driver for the CMS.
 *  - On Vercel (BLOB_READ_WRITE_TOKEN set) everything lives in Vercel Blob.
 *  - Locally it falls back to the `.data/` folder so the CMS works with `npm run dev`.
 *
 * Writes use etags for optimistic concurrency, so two editors can't silently
 * overwrite each other. Private data (messages, pending comments) is stored under
 * a prefix derived from AUTH_SECRET, so its URLs can't be guessed.
 */

export const blobMode = () => !!process.env.BLOB_READ_WRITE_TOKEN;
/** On Netlify, everything lives in Netlify Blobs (site-wide store "cms"); files are served via /api/files. */
export const netlifyMode = () => !blobMode() && (process.env.CMS_STORAGE === "netlify" || !!process.env.NETLIFY_BLOBS_CONTEXT || process.env.NETLIFY === "true");
async function nstore() {
  const { getStore } = await import("@netlify/blobs");
  return getStore({ name: "cms", consistency: "strong" });
}
const localUrl = (pathname: string) => "/api/files/" + pathname;
const DATA_DIR = path.join(process.cwd(), ".data");

export class ConflictError extends Error { constructor() { super("conflict"); } }

/** Unguessable folder for private records. */
export function privatePrefix() {
  const secret = process.env.AUTH_SECRET || "local-dev-secret";
  return "private-" + createHash("sha256").update("cms-private:" + secret).digest("hex").slice(0, 24) + "/";
}

const blob = () => import("@vercel/blob");

export async function readJson<T>(key: string): Promise<{ data: T; etag: string } | null> {
  if (blobMode()) {
    const { get, head, BlobNotFoundError } = await blob();
    try {
      // Etag comes from the metadata API (the CDN can return a weak, gzip-variant etag that If-Match rejects).
      const meta = await head(key);
      const res = await get(key, { access: "public", useCache: false } as any);
      if (!res || res.statusCode !== 200 || !res.stream) return null;
      const text = await new Response(res.stream).text();
      const etag = String(meta.etag || "");
      return { data: JSON.parse(text) as T, etag };
    } catch (e: any) {
      if (e instanceof BlobNotFoundError || e?.name === "BlobNotFoundError" || /not.?found|does not exist/i.test(String(e?.message))) return null;
      throw e;
    }
  }
  if (netlifyMode()) {
    const st = await nstore();
    const res = await st.getWithMetadata(key, { type: "text" });
    if (!res || res.data == null) return null;
    // Our own revision id (kept in metadata) is the version token; it doesn't depend on HTTP etags.
    const rev = String((res.metadata as any)?.rev || res.etag || "legacy");
    return { data: JSON.parse(res.data as string) as T, etag: rev };
  }
  try {
    const file = path.join(DATA_DIR, key);
    const [text, stat] = await Promise.all([fs.readFile(file, "utf8"), fs.stat(file)]);
    return { data: JSON.parse(text) as T, etag: String(stat.mtimeMs) };
  } catch {
    return null;
  }
}

/** Writes JSON. Pass `etag` to only write if nobody else changed it (null = must not exist). */
export async function writeJson(key: string, data: unknown, etag?: string | null): Promise<string> {
  const body = JSON.stringify(data);
  if (blobMode()) {
    const { put } = await blob();
    try {
      const opts: any = { access: "public", addRandomSuffix: false, allowOverwrite: true, contentType: "application/json", cacheControlMaxAge: 60 };
      if (etag) opts.ifMatch = etag;
      const res: any = await put(key, body, opts);
      return res.etag || "";
    } catch (e: any) {
      if (e?.name === "BlobPreconditionFailedError" || /precondition/i.test(String(e?.message))) throw new ConflictError();
      throw e;
    }
  }
  if (netlifyMode()) {
    const st = await nstore();
    const rev = randomUUID();
    const metadata = { size: Buffer.byteLength(body), uploadedAt: new Date().toISOString(), contentType: "application/json", rev };
    const opts: any = { metadata };
    if (etag === null) opts.onlyIfNew = true;
    else if (etag) {
      // Check the caller's revision is still current, then write only if the blob is unchanged since that check.
      const cur = await st.getWithMetadata(key, { type: "text" });
      if (!cur || cur.data == null) throw new ConflictError();
      const curRev = String((cur.metadata as any)?.rev || cur.etag || "legacy");
      if (curRev !== etag) throw new ConflictError();
      if (cur.etag) opts.onlyIfMatch = cur.etag;
    }
    const res: any = await st.set(key, body, opts);
    if (etag !== undefined && res && res.modified === false) throw new ConflictError();
    return rev;
  }
  const file = path.join(DATA_DIR, key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  if (etag) {
    try {
      const stat = await fs.stat(file);
      if (String(stat.mtimeMs) !== etag) throw new ConflictError();
    } catch (e) {
      if (e instanceof ConflictError) throw e;
    }
  }
  await fs.writeFile(file, body);
  return String((await fs.stat(file)).mtimeMs);
}

export interface StoredFile { url: string; pathname: string; size: number; uploadedAt: string; downloadUrl: string }

export async function listFiles(prefix: string, limit = 1000): Promise<StoredFile[]> {
  if (blobMode()) {
    const { list } = await blob();
    const out: StoredFile[] = [];
    let cursor: string | undefined;
    do {
      const res = await list({ prefix, cursor, limit: 1000 });
      for (const b of res.blobs) out.push({ url: b.url, pathname: b.pathname, size: b.size, uploadedAt: new Date(b.uploadedAt).toISOString(), downloadUrl: b.downloadUrl });
      cursor = res.hasMore ? res.cursor : undefined;
    } while (cursor && out.length < limit);
    return out;
  }
  if (netlifyMode()) {
    const st = await nstore();
    const { blobs } = await st.list({ prefix });
    const keys = blobs.map((b) => b.key).slice(0, limit);
    return Promise.all(keys.map(async (k) => {
      const m: any = await st.getMetadata(k).catch(() => null);
      const md = m?.metadata || {};
      return { url: localUrl(k), pathname: k, size: Number(md.size) || 0, uploadedAt: String(md.uploadedAt || new Date(0).toISOString()), downloadUrl: localUrl(k) + "?download=1" };
    }));
  }
  const dir = path.join(DATA_DIR, prefix);
  const out: StoredFile[] = [];
  async function walk(d: string) {
    let entries: import("node:fs").Dirent[] = [];
    try { entries = await fs.readdir(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) await walk(full);
      else {
        const st = await fs.stat(full);
        const pathname = path.relative(DATA_DIR, full).split(path.sep).join("/");
        out.push({ url: "/api/files/" + pathname, pathname, size: st.size, uploadedAt: st.mtime.toISOString(), downloadUrl: "/api/files/" + pathname + "?download=1" });
      }
    }
  }
  await walk(dir);
  return out;
}

export async function deleteFile(urlOrPath: string) {
  if (blobMode()) {
    const { del } = await blob();
    await del(urlOrPath);
    return;
  }
  const rel = urlOrPath.replace(/^\/api\/files\//, "");
  if (netlifyMode()) {
    if (!rel || rel.startsWith("/") || rel.includes("..")) throw new Error("bad path");
    await (await nstore()).delete(rel);
    return;
  }
  const full = path.join(DATA_DIR, rel);
  if (!full.startsWith(DATA_DIR)) throw new Error("bad path");
  await fs.rm(full, { force: true });
}

/** Server-side upload (used locally, and for small files). */
export async function putFile(pathname: string, data: Buffer | Blob, contentType?: string): Promise<StoredFile> {
  if (blobMode()) {
    const { put } = await blob();
    const res: any = await put(pathname, data as any, { access: "public", addRandomSuffix: true, contentType });
    return { url: res.url, pathname: res.pathname, size: 0, uploadedAt: new Date().toISOString(), downloadUrl: res.downloadUrl };
  }
  const ext = path.extname(pathname);
  const finalPath = pathname.slice(0, pathname.length - ext.length) + "-" + randomUUID().slice(0, 8) + ext;
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(await (data as Blob).arrayBuffer());
  if (netlifyMode()) {
    const st = await nstore();
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    await st.set(finalPath, ab, { metadata: { size: buf.length, uploadedAt: new Date().toISOString(), contentType: contentType || "" } });
    return { url: localUrl(finalPath), pathname: finalPath, size: buf.length, uploadedAt: new Date().toISOString(), downloadUrl: localUrl(finalPath) + "?download=1" };
  }
  const full = path.join(DATA_DIR, finalPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buf);
  return { url: "/api/files/" + finalPath, pathname: finalPath, size: buf.length, uploadedAt: new Date().toISOString(), downloadUrl: "/api/files/" + finalPath + "?download=1" };
}

/** Local-only: read a stored file back (served by /api/files). */
export async function readLocalFile(rel: string) {
  if (netlifyMode()) {
    if (!rel || rel.startsWith("/") || rel.includes("..")) return null;
    const ab = await (await nstore()).get(rel, { type: "arrayBuffer" }).catch(() => null);
    return ab ? Buffer.from(ab as ArrayBuffer) : null;
  }
  const full = path.join(DATA_DIR, rel);
  if (!full.startsWith(DATA_DIR + path.sep)) return null;
  try { return await fs.readFile(full); } catch { return null; }
}

/** Read-modify-write with automatic retry on concurrent edits. */
export async function mutateJson<T>(key: string, init: () => T, fn: (cur: T) => T | Promise<T>, tries = 6): Promise<T> {
  for (let i = 0; i < tries; i++) {
    const cur = await readJson<T>(key);
    const next = await fn(cur ? cur.data : init());
    try {
      await writeJson(key, next, cur ? cur.etag : undefined);
      return next;
    } catch (e) {
      if (!(e instanceof ConflictError)) throw e;
      await new Promise((r) => setTimeout(r, 80 + Math.random() * 200 * (i + 1)));
    }
  }
  throw new ConflictError();
}
