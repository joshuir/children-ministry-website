import "server-only";
import { randomUUID } from "node:crypto";
import { unstable_cache, revalidatePath, revalidateTag } from "next/cache";
import { normalize, seedContent, type CmsContent } from "./schema";
import { deleteFile, listFiles, mutateJson, privatePrefix, readJson, writeJson, blobMode } from "./store";
import type { Reaction } from "@/lib/types";

const CONTENT_KEY = "cms/content.json";
const hist = () => privatePrefix() + "history/";
const engagementKey = () => privatePrefix() + "engagement.json";
const inbox = () => privatePrefix() + "inbox/";
const subsKey = () => privatePrefix() + "subscribers.json";

/* ------------------------------ content ------------------------------ */

async function readContentRaw(): Promise<{ content: CmsContent; etag: string | null }> {
  try {
    const res = await readJson<CmsContent>(CONTENT_KEY);
    if (res) return { content: normalize(res.data), etag: res.etag };
  } catch (e) {
    console.error("[cms] read failed, using seed content", e);
  }
  return { content: seedContent(), etag: null };
}

/** Cached for the public site; refreshed instantly whenever an admin saves. */
export const getContent = unstable_cache(async () => (await readContentRaw()).content, ["cms-content-v1"], { tags: ["cms"], revalidate: 600 });

/** Uncached read for the editor (includes the etag for conflict detection). */
export const getContentForEdit = readContentRaw;

export function refreshSite() {
  revalidateTag("cms");
  revalidatePath("/", "layout");
}

export async function saveContent(next: CmsContent, etag: string | null, by: string) {
  const content = normalize({ ...next, updatedAt: new Date().toISOString(), updatedBy: by });
  const newEtag = await writeJson(CONTENT_KEY, content, etag ?? null);
  // Keep a version for undo / restore. Best effort.
  try {
    await writeJson(hist() + content.updatedAt.replace(/[:.]/g, "-") + ".json", content);
    const versions = await listFiles(hist());
    const old = versions.sort((a, b) => b.pathname.localeCompare(a.pathname)).slice(60);
    await Promise.all(old.map((v) => deleteFile(v.url)));
  } catch (e) {
    console.error("[cms] history write failed", e);
  }
  refreshSite();
  return { content, etag: newEtag };
}

export async function listVersions() {
  const v = await listFiles(hist());
  return v
    .sort((a, b) => b.pathname.localeCompare(a.pathname))
    .map((f) => ({ id: f.pathname.split("/").pop()!.replace(/\.json$/, ""), url: f.url, size: f.size, savedAt: f.uploadedAt }));
}

export async function readVersion(id: string) {
  if (!/^[\w-]+$/.test(id)) return null;
  const res = await readJson<CmsContent>(hist() + id + ".json");
  return res ? normalize(res.data) : null;
}

/* ---------------------------- engagement ---------------------------- */

export interface PublicComment {
  id: string;
  postId: string;
  parentId?: string;
  author: string;
  body: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
  reports?: number;
}
export interface Engagement {
  reactions: Record<string, Partial<Record<Reaction, number>>>;
  comments: PublicComment[];
  updatedAt: string;
}
const emptyEngagement = (): Engagement => ({ reactions: {}, comments: [], updatedAt: new Date(0).toISOString() });

let engCache: { at: number; data: Engagement } | null = null;
export async function getEngagement(maxAgeMs = 2500): Promise<Engagement> {
  if (engCache && Date.now() - engCache.at < maxAgeMs) return engCache.data;
  const res = await readJson<Engagement>(engagementKey()).catch(() => null);
  const data = res?.data || emptyEngagement();
  engCache = { at: Date.now(), data };
  return data;
}

export async function mutateEngagement(fn: (e: Engagement) => Engagement | void) {
  const data = await mutateJson<Engagement>(engagementKey(), emptyEngagement, (cur) => {
    const copy: Engagement = JSON.parse(JSON.stringify(cur));
    const out = fn(copy) || copy;
    out.updatedAt = new Date().toISOString();
    return out;
  });
  engCache = { at: Date.now(), data };
  return data;
}

/* ------------------------------- inbox ------------------------------- */

export interface InboxMessage {
  id: string;
  kind: "contact" | "report";
  createdAt: string;
  read?: boolean;
  name?: string;
  email?: string;
  phone?: string;
  topic?: string;
  message: string;
  meta?: Record<string, string>;
}

export async function addInbox(msg: Omit<InboxMessage, "id" | "createdAt">) {
  const createdAt = new Date().toISOString();
  const id = createdAt.replace(/[:.]/g, "-") + "-" + randomUUID().slice(0, 8);
  await writeJson(inbox() + id + ".json", { ...msg, id, createdAt });
  return id;
}

export async function listInbox(): Promise<(InboxMessage & { url: string })[]> {
  const files = (await listFiles(inbox())).sort((a, b) => b.pathname.localeCompare(a.pathname)).slice(0, 300);
  const items = await Promise.all(
    files.map(async (f) => {
      const key = f.pathname;
      const res = await readJson<InboxMessage>(key).catch(() => null);
      return res ? { ...res.data, url: blobMode() ? f.url : key } : null;
    }),
  );
  return items.filter(Boolean) as (InboxMessage & { url: string })[];
}

export async function updateInbox(id: string, patch: Partial<InboxMessage>) {
  if (!/^[\w-]+$/.test(id)) return;
  const key = inbox() + id + ".json";
  const cur = await readJson<InboxMessage>(key);
  if (cur) await writeJson(key, { ...cur.data, ...patch });
}

export async function deleteInbox(id: string) {
  if (!/^[\w-]+$/.test(id)) return;
  const key = inbox() + id + ".json";
  if (!blobMode()) return deleteFile(key);
  const files = await listFiles(key);
  await Promise.all(files.map((f) => deleteFile(f.url)));
}

/* ---------------------------- subscribers ---------------------------- */

export interface Subscriber { email: string; name?: string; createdAt: string; topics?: string[]; source?: string }

export async function addSubscriber(s: Omit<Subscriber, "createdAt">) {
  let existing = false;
  const list = await mutateJson<Subscriber[]>(subsKey(), () => [], (list) => {
    const email = s.email.toLowerCase();
    existing = list.some((x) => x.email === email);
    if (existing) return list;
    return [...list, { ...s, email, createdAt: new Date().toISOString(), source: s.source || "website" }];
  });
  return { count: list.length, existing };
}
export async function listSubscribers() {
  return (await readJson<Subscriber[]>(subsKey()))?.data || [];
}
export async function removeSubscriber(email: string) {
  return mutateJson<Subscriber[]>(subsKey(), () => [], (list) => list.filter((x) => x.email !== email.toLowerCase()));
}
