"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Check, Copy, Download, ExternalLink, FileSpreadsheet, FileUp, Loader2, Mail, MailOpen, RefreshCw, RotateCcw, Send, Trash2, Upload, X, Flag } from "lucide-react";
import type { CmsContent } from "@/lib/cms/schema";
import { normalize, validate } from "@/lib/cms/schema";
import { smallBtn, inputCls, useCms, useMediaList } from "./fields";
import { downloadJson, fmtBytes, isImage, isVideo, uploadFile } from "./upload";

const card = "rounded-3xl bg-white p-5 ring-1 ring-ink/10";
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

async function api(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) }, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "Request failed");
  return j;
}

/* ------------------------------- Dashboard ------------------------------- */

export function Dashboard({ content, go, counts }: { content: CmsContent; go: (id: string) => void; counts: { pending: number; unread: number } }) {
  const today = new Date().toISOString().slice(0, 10);
  const next = content.events.filter((e) => (e.endDate || e.date) >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const lessonDates = content.lessons.map((l) => l.date).sort();
  const latestLesson = lessonDates[lessonDates.length - 1];
  const tiles = [
    { id: "comments", label: "Comments to review", value: counts.pending, hot: counts.pending > 0 },
    { id: "inbox", label: "Unread messages", value: counts.unread, hot: counts.unread > 0 },
    { id: "posts", label: "Feed posts", value: content.posts.length },
    { id: "events", label: "Upcoming events", value: content.events.filter((e) => (e.endDate || e.date) >= today).length },
    { id: "lessons", label: "Bible lessons", value: content.lessons.length },
    { id: "gallery", label: "Gallery items", value: content.gallery.length },
  ];
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {tiles.map((t) => (
          <button key={t.id} type="button" onClick={() => go(t.id)} className={clsx("rounded-3xl p-5 text-left ring-1 transition-[transform,box-shadow] duration-100 hover:-translate-y-0.5 hover:shadow-card active:scale-[.98]", t.hot ? "bg-sun-100 ring-sun-400" : "bg-white ring-ink/10")}>
            <p className="font-display text-4xl font-bold tabular-nums">{t.value}</p>
            <p className="mt-1 text-sm font-bold text-ink-mute">{t.label}</p>
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className={card}>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink-mute">Next event</p>
          {next ? <><p className="mt-2 font-display text-xl font-semibold">{next.title}</p><p className="text-ink-mute">{next.date} · {next.time} · {next.location}</p></> : <p className="mt-2 text-ink-mute">No upcoming events.</p>}
          <button type="button" onClick={() => go("events")} className={clsx(smallBtn, "mt-4 bg-ink text-white")}>Manage events</button>
        </div>
        <div className={card}>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink-mute">Lessons</p>
          <p className="mt-2 font-display text-xl font-semibold">Latest lesson date: {latestLesson || "—"}</p>
          <p className="text-ink-mute">{latestLesson && latestLesson < today ? "Time to add next Sunday's lesson." : "You're up to date."}</p>
          <button type="button" onClick={() => go("lessons")} className={clsx(smallBtn, "mt-4 bg-ink text-white")}>Open lessons</button>
        </div>
      </div>
      <div className={clsx(card, "bg-brand-50 ring-brand-100")}>
        <p className="font-display text-lg font-semibold">How saving works</p>
        <ul className="mt-2 grid gap-1 text-ink-soft">
          <li>• Edit anything, then press <b>Save &amp; publish</b> (or Ctrl/⌘ + S). The live site updates within seconds.</li>
          <li>• Every save keeps a version — restore any of them from <b>Versions &amp; backup</b>.</li>
          <li>• Comments and messages from the public site don&apos;t need saving: approve, delete or download them directly.</li>
        </ul>
      </div>
    </div>
  );
}

/* ------------------------------ Media library ----------------------------- */

export function MediaPanel({ content }: { content: CmsContent }) {
  const { storage, toast } = useCms();
  const { files, error, reload } = useMediaList();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | "image" | "video" | "file">("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const used = useMemo(() => JSON.stringify(content), [content]);

  async function onFiles(list: FileList | null) {
    if (!list?.length) return;
    for (const [i, f] of Array.from(list).entries()) {
      setBusy(`Uploading ${i + 1} of ${list.length}…`);
      try { await uploadFile(f, "library", storage); } catch (e: any) { toast(`${f.name}: ${e.message}`, "err"); }
    }
    setBusy(null);
    toast(`Uploaded ${list.length} file${list.length > 1 ? "s" : ""}`);
    reload();
  }
  async function remove(urls: string[]) {
    const inUse = urls.filter((u) => used.includes(u));
    if (!confirm(inUse.length ? `${inUse.length} of these ${urls.length > 1 ? "files are" : "file is"} used on the site and will show as broken. Delete anyway?` : `Delete ${urls.length} file${urls.length > 1 ? "s" : ""}? This can't be undone.`)) return;
    try { await api("/api/cms/media", { method: "DELETE", body: JSON.stringify({ urls }) }); toast("Deleted"); setSel([]); reload(); } catch (e: any) { toast(e.message, "err"); }
  }

  const list = (files || []).filter((f) => {
    const t = isImage(f.url) ? "image" : isVideo(f.url) ? "video" : "file";
    return (kind === "all" || kind === t) && f.pathname.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => input.current?.click()} className={clsx(smallBtn, "min-h-[44px] bg-brand-500 px-5 text-white")}><Upload className="h-4 w-4" />Upload files</button>
        <input ref={input} type="file" multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files…" className={clsx(inputCls, "h-11 w-48")} />
        <select value={kind} onChange={(e) => setKind(e.target.value as any)} className={clsx(inputCls, "h-11 w-36")}>
          <option value="all">All types</option><option value="image">Photos</option><option value="video">Videos</option><option value="file">Documents</option>
        </select>
        <button type="button" onClick={reload} className={clsx(smallBtn, "min-h-[44px] bg-white ring-1 ring-ink/10")}><RefreshCw className="h-4 w-4" />Refresh</button>
        {sel.length > 0 && <button type="button" onClick={() => remove(sel)} className={clsx(smallBtn, "min-h-[44px] bg-coral-100 text-coral-600")}><Trash2 className="h-4 w-4" />Delete {sel.length} selected</button>}
        {busy && <span className="flex items-center gap-2 text-sm font-bold text-brand-700"><Loader2 className="h-4 w-4 animate-spin" />{busy}</span>}
      </div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
        className="grid grid-cols-2 gap-3 rounded-3xl border-2 border-dashed border-ink/10 p-3 sm:grid-cols-3 xl:grid-cols-5"
      >
        {files === null && <p className="col-span-full flex items-center gap-2 p-4 text-ink-mute"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>}
        {error && <p className="col-span-full p-4 text-coral-600">{error}</p>}
        {files && !list.length && <p className="col-span-full p-8 text-center text-ink-mute">Drop photos, videos or PDFs here to upload them.</p>}
        {list.map((f) => {
          const on = sel.includes(f.url);
          return (
            <div key={f.url} className={clsx("group overflow-hidden rounded-2xl bg-white ring-1", on ? "ring-2 ring-brand-500" : "ring-ink/10")}>
              <button type="button" onClick={() => setSel((s) => (on ? s.filter((x) => x !== f.url) : [...s, f.url]))} className="relative block aspect-[4/3] w-full bg-paper" aria-pressed={on} aria-label={`Select ${f.pathname}`}>
                {isImage(f.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : isVideo(f.url) ? <video src={f.url} muted preload="metadata" className="h-full w-full object-cover" /> : <span className="flex h-full items-center justify-center font-display text-lg font-bold text-ink-mute">{f.pathname.split(".").pop()?.toUpperCase()}</span>}
                <span className={clsx("absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full ring-2 ring-white", on ? "bg-brand-500 text-white" : "bg-white/80")}>{on && <Check className="h-4 w-4" />}</span>
                {used.includes(f.url) && <span className="absolute right-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-white">IN USE</span>}
              </button>
              <div className="p-2.5">
                <p className="truncate text-xs font-semibold" title={f.pathname}>{f.pathname.split("/").pop()}</p>
                <p className="text-[11px] text-ink-mute">{f.size ? fmtBytes(f.size) + " · " : ""}{when(f.uploadedAt)}</p>
                <div className="mt-1.5 flex gap-1">
                  <button type="button" title="Copy link" onClick={async () => { await navigator.clipboard.writeText(f.url.startsWith("/") ? location.origin + f.url : f.url); toast("Link copied"); }} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-paper"><Copy className="h-4 w-4" /></button>
                  <a title="Download" href={f.downloadUrl} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-paper"><Download className="h-4 w-4" /></a>
                  <a title="Open" href={f.url} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-paper"><ExternalLink className="h-4 w-4" /></a>
                  <button type="button" title="Delete" onClick={() => remove([f.url])} className="ml-auto flex h-8 w-8 items-center justify-center rounded-full text-coral-600 hover:bg-coral-100"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------- Comments ------------------------------- */

interface PComment { id: string; postId: string; parentId?: string; author: string; body: string; createdAt: string; status: "pending" | "approved" | "rejected" }

export function CommentsPanel({ content, onCount }: { content: CmsContent; onCount: (n: number) => void }) {
  const { toast } = useCms();
  const [list, setList] = useState<PComment[] | null>(null);
  const [tab, setTab] = useState<PComment["status"]>("pending");
  const [sel, setSel] = useState<string[]>([]);
  async function load() {
    try { const j = await api("/api/cms/engagement"); setList(j.comments); onCount(j.comments.filter((c: PComment) => c.status === "pending").length); } catch (e: any) { toast(e.message, "err"); setList([]); }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, []);
  async function act(ids: string[], body: object, msg: string) {
    try { const j = await api("/api/cms/engagement", { method: "PATCH", body: JSON.stringify({ ids, ...body }) }); setList(j.comments); onCount(j.comments.filter((c: PComment) => c.status === "pending").length); setSel([]); toast(msg); } catch (e: any) { toast(e.message, "err"); }
  }
  const shown = (list || []).filter((c) => c.status === tab).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const postText = (id: string) => content.posts.find((p) => p.id === id)?.body.slice(0, 80) || id;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["pending", "approved", "rejected"] as const).map((t) => (
          <button key={t} type="button" onClick={() => { setTab(t); setSel([]); }} aria-pressed={tab === t} className={clsx(smallBtn, "min-h-[40px] capitalize", tab === t ? "bg-ink text-white" : "bg-white ring-1 ring-ink/10")}>
            {t} <span className="rounded-full bg-white/20 px-1.5 text-xs">{(list || []).filter((c) => c.status === t).length}</span>
          </button>
        ))}
        <button type="button" onClick={load} className={clsx(smallBtn, "min-h-[40px] bg-white ring-1 ring-ink/10")}><RefreshCw className="h-4 w-4" />Refresh</button>
        {sel.length > 0 && <>
          {tab !== "approved" && <button type="button" onClick={() => act(sel, { status: "approved" }, "Approved")} className={clsx(smallBtn, "min-h-[40px] bg-brand-500 text-white")}><Check className="h-4 w-4" />Approve {sel.length}</button>}
          <button type="button" onClick={() => confirm("Delete permanently?") && act(sel, { remove: true }, "Deleted")} className={clsx(smallBtn, "min-h-[40px] bg-coral-100 text-coral-600")}><Trash2 className="h-4 w-4" />Delete {sel.length}</button>
        </>}
      </div>
      {list === null && <p className="flex items-center gap-2 text-ink-mute"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>}
      {list && !shown.length && <p className={clsx(card, "text-center text-ink-mute")}>{tab === "pending" ? "All caught up — no comments waiting. 🎉" : `No ${tab} comments.`}</p>}
      {shown.map((c) => (
        <div key={c.id} className={clsx(card, "flex gap-3")}>
          <input type="checkbox" checked={sel.includes(c.id)} onChange={(e) => setSel((s) => (e.target.checked ? [...s, c.id] : s.filter((x) => x !== c.id)))} className="mt-1 h-5 w-5 accent-brand-500" aria-label="Select comment" />
          <div className="min-w-0 flex-1">
            <p className="text-sm"><b>{c.author}</b> <span className="text-ink-mute">· {when(c.createdAt)}{c.parentId ? " · reply" : ""}</span></p>
            <p className="mt-1 whitespace-pre-line break-words text-[15px]">{c.body}</p>
            <p className="mt-2 truncate text-xs text-ink-mute">On: “{postText(c.postId)}”</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.status !== "approved" && <button type="button" onClick={() => act([c.id], { status: "approved" }, "Approved — it's live on the feed")} className={clsx(smallBtn, "bg-brand-500 text-white")}><Check className="h-4 w-4" />Approve</button>}
              {c.status !== "rejected" && <button type="button" onClick={() => act([c.id], { status: "rejected" }, "Hidden")} className={clsx(smallBtn, "bg-white ring-1 ring-ink/10")}><X className="h-4 w-4" />{c.status === "approved" ? "Unpublish" : "Reject"}</button>}
              <button type="button" onClick={() => confirm("Delete permanently?") && act([c.id], { remove: true }, "Deleted")} className={clsx(smallBtn, "text-coral-600 hover:bg-coral-100")}><Trash2 className="h-4 w-4" />Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* --------------------------------- Inbox --------------------------------- */

interface Msg { id: string; kind: "contact" | "report"; createdAt: string; read?: boolean; name?: string; email?: string; phone?: string; topic?: string; message: string; meta?: Record<string, string> }

export function InboxPanel({ onCount }: { onCount: (n: number) => void }) {
  const { toast } = useCms();
  const [tab, setTab] = useState<"messages" | "subscribers">("messages");
  const [msgs, setMsgs] = useState<Msg[] | null>(null);
  const [subs, setSubs] = useState<{ email: string; name?: string; createdAt: string }[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  async function load() {
    try {
      const [m, s] = await Promise.all([api("/api/cms/inbox"), api("/api/cms/inbox?what=subscribers")]);
      setMsgs(m.messages); setSubs(s.subscribers); onCount(m.messages.filter((x: Msg) => !x.read).length);
    } catch (e: any) { toast(e.message, "err"); setMsgs([]); setSubs([]); }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);
  async function markRead(m: Msg, read = true) {
    setMsgs((l) => l && l.map((x) => (x.id === m.id ? { ...x, read } : x)));
    onCount((msgs || []).filter((x) => (x.id === m.id ? !read : !x.read)).length);
    api("/api/cms/inbox", { method: "PATCH", body: JSON.stringify({ id: m.id, read }) }).catch(() => {});
  }
  async function del(body: object, msg: string) {
    if (!confirm("Delete permanently?")) return;
    try { await api("/api/cms/inbox", { method: "DELETE", body: JSON.stringify(body) }); toast(msg); load(); } catch (e: any) { toast(e.message, "err"); }
  }
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setTab("messages")} aria-pressed={tab === "messages"} className={clsx(smallBtn, "min-h-[40px]", tab === "messages" ? "bg-ink text-white" : "bg-white ring-1 ring-ink/10")}>Messages {msgs && `(${msgs.length})`}</button>
        <button type="button" onClick={() => setTab("subscribers")} aria-pressed={tab === "subscribers"} className={clsx(smallBtn, "min-h-[40px]", tab === "subscribers" ? "bg-ink text-white" : "bg-white ring-1 ring-ink/10")}>Newsletter subscribers {subs && `(${subs.length})`}</button>
        <a href={`/api/cms/inbox?${tab === "subscribers" ? "what=subscribers&" : ""}format=xlsx`} className={clsx(smallBtn, "min-h-[40px] bg-mint-600 text-white hover:bg-ink")}><FileSpreadsheet className="h-4 w-4" />Excel sheet</a>
        <a href={`/api/cms/inbox?${tab === "subscribers" ? "what=subscribers&" : ""}format=csv`} className={clsx(smallBtn, "min-h-[40px] bg-white ring-1 ring-ink/10")}><Download className="h-4 w-4" />CSV</a>
        <button type="button" onClick={load} className={clsx(smallBtn, "min-h-[40px] bg-white ring-1 ring-ink/10")}><RefreshCw className="h-4 w-4" />Refresh</button>
      </div>
      {tab === "messages" ? (
        <div className="grid gap-2">
          {msgs === null && <p className="flex items-center gap-2 text-ink-mute"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>}
          {msgs && !msgs.length && <p className={clsx(card, "text-center text-ink-mute")}>No messages yet. Contact-form messages and reports will appear here.</p>}
          {msgs?.map((m) => (
            <div key={m.id} className={clsx(card, "p-0", !m.read && "ring-2 ring-brand-500")}>
              <button type="button" onClick={() => { setOpen(open === m.id ? null : m.id); if (!m.read) markRead(m); }} className="flex w-full items-center gap-3 p-4 text-left" aria-expanded={open === m.id}>
                {m.kind === "report" ? <Flag className="h-5 w-5 shrink-0 text-coral-600" /> : m.read ? <MailOpen className="h-5 w-5 shrink-0 text-ink-mute" /> : <Mail className="h-5 w-5 shrink-0 text-brand-500" />}
                <span className="min-w-0 flex-1">
                  <span className={clsx("block truncate", !m.read && "font-bold")}>{m.kind === "report" ? "Reported content" : `${m.name} — ${m.topic || "Message"}`}</span>
                  <span className="block truncate text-sm text-ink-mute">{m.message}</span>
                </span>
                <span className="shrink-0 text-xs text-ink-mute">{when(m.createdAt)}</span>
              </button>
              {open === m.id && (
                <div className="border-t border-ink/10 p-4">
                  {m.email && <p className="text-sm"><b>Email:</b> <a className="text-brand-600 underline" href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.topic || "Your message")}`}>{m.email}</a></p>}
                  {m.phone && <p className="text-sm"><b>Phone:</b> <a className="text-brand-600 underline" href={`tel:${m.phone}`}>{m.phone}</a></p>}
                  {m.meta?.postId && <p className="text-sm"><b>Post:</b> <a className="text-brand-600 underline" href={`/blog/#${m.meta.postId}`} target="_blank" rel="noreferrer">{m.meta.postId}</a>{m.meta.commentId ? ` · comment ${m.meta.commentId}` : ""}</p>}
                  <p className="mt-3 whitespace-pre-line rounded-2xl bg-paper p-4">{m.message}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {m.email && <a href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.topic || "Your message")}`} className={clsx(smallBtn, "bg-brand-500 text-white")}><Mail className="h-4 w-4" />Reply by email</a>}
                    <button type="button" onClick={() => markRead(m, false)} className={clsx(smallBtn, "bg-white ring-1 ring-ink/10")}>Mark unread</button>
                    <button type="button" onClick={() => del({ id: m.id }, "Message deleted")} className={clsx(smallBtn, "text-coral-600 hover:bg-coral-100")}><Trash2 className="h-4 w-4" />Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-3">
        {subs && subs.length > 0 && (
          <div className={clsx(card, "flex flex-col gap-3 bg-brand-50 sm:flex-row sm:items-center")}>
            <Send className="h-6 w-6 shrink-0 text-brand-600" />
            <div className="min-w-0 flex-1">
              <p className="font-bold">Send this month&apos;s newsletter</p>
              <p className="text-sm text-ink-mute">Download the Excel sheet for a mail-merge, or put everyone in BCC so addresses stay private.</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" onClick={() => { navigator.clipboard.writeText(subs.map((x) => x.email).join("; ")).then(() => toast(`${subs.length} emails copied — paste into BCC`), () => toast("Couldn't copy", "err")); }} className={clsx(smallBtn, "bg-white ring-1 ring-ink/10")}><Copy className="h-4 w-4" />Copy emails</button>
              <a href={`mailto:?bcc=${encodeURIComponent(subs.map((x) => x.email).join(","))}&subject=${encodeURIComponent("Children's Ministry family update")}`} className={clsx(smallBtn, "bg-brand-500 text-white")}><Mail className="h-4 w-4" />Email all (BCC)</a>
            </div>
          </div>
        )}
        <div className={clsx(card, "p-0")}>
          {subs && !subs.length && <p className="p-6 text-center text-ink-mute">No subscribers yet.</p>}
          <ul className="divide-y divide-ink/10">
            {subs?.map((s) => (
              <li key={s.email} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1"><b className="block truncate">{s.name || "—"}</b><span className="block truncate text-sm text-ink-mute">{s.email}</span></span>
                <span className="hidden text-xs text-ink-mute sm:block">{when(s.createdAt)}</span>
                <button type="button" onClick={() => del({ email: s.email }, "Subscriber removed")} className="flex h-9 w-9 items-center justify-center rounded-full text-coral-600 hover:bg-coral-100" aria-label={`Remove ${s.email}`}><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------- Versions ------------------------------- */

export function VersionsPanel({ content, onRestore, onImport }: { content: CmsContent; onRestore: (c: CmsContent, etag: string) => void; onImport: (c: CmsContent) => void }) {
  const { toast } = useCms();
  const [list, setList] = useState<{ id: string; savedAt: string; size: number }[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  async function load() { try { setList((await api("/api/cms/history")).versions); } catch (e: any) { toast(e.message, "err"); setList([]); } }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);
  async function restore(id: string) {
    if (!confirm("Restore this version? The live site will switch to it straight away (your current version stays in the history).")) return;
    setBusy(id);
    try { const j = await api("/api/cms/history", { method: "POST", body: JSON.stringify({ id }) }); onRestore(j.content, j.etag); toast("Version restored and published"); load(); } catch (e: any) { toast(e.message, "err"); } finally { setBusy(null); }
  }
  async function importFile(f?: File) {
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      const err = validate(data);
      if (err) throw new Error(err);
      onImport(normalize(data));
      toast("Backup loaded into the editor — press Save & publish to make it live.");
    } catch (e: any) { toast("Couldn't import: " + (e.message || "invalid file"), "err"); }
  }
  const label = (id: string) => id.replace(/^(\d{4}-\d{2}-\d{2})T(\d{2})-(\d{2}).*$/, "$1 $2:$3 UTC");
  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className={card}>
          <p className="font-display text-lg font-semibold">Download a backup</p>
          <p className="mt-1 text-sm text-ink-mute">Everything editable in one JSON file (photos and videos stay in the media library).</p>
          <button type="button" onClick={() => downloadJson(content, `childrens-ministry-backup-${new Date().toISOString().slice(0, 10)}.json`)} className={clsx(smallBtn, "mt-4 min-h-[44px] bg-ink px-5 text-white")}><Download className="h-4 w-4" />Download backup</button>
        </div>
        <div className={card}>
          <p className="font-display text-lg font-semibold">Import a backup</p>
          <p className="mt-1 text-sm text-ink-mute">Loads a backup into the editor so you can check it before publishing.</p>
          <button type="button" onClick={() => file.current?.click()} className={clsx(smallBtn, "mt-4 min-h-[44px] bg-white px-5 ring-1 ring-ink/10")}><FileUp className="h-4 w-4" />Choose file…</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { importFile(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
      </div>
      <div className={clsx(card, "p-0")}>
        <p className="border-b border-ink/10 px-5 py-3 font-display text-lg font-semibold">Saved versions</p>
        {list === null && <p className="flex items-center gap-2 p-5 text-ink-mute"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>}
        {list && !list.length && <p className="p-5 text-ink-mute">No versions yet — one is kept every time you save.</p>}
        <ul className="divide-y divide-ink/10">
          {list?.map((v, i) => (
            <li key={v.id} className="flex flex-wrap items-center gap-2 px-5 py-3">
              <span className="min-w-0 flex-1 font-semibold">{label(v.id)}{i === 0 && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">Latest</span>}</span>
              <a href={`/api/cms/history?id=${v.id}`} className={clsx(smallBtn, "bg-white ring-1 ring-ink/10")}><Download className="h-4 w-4" />Download</a>
              {i > 0 && <button type="button" disabled={!!busy} onClick={() => restore(v.id)} className={clsx(smallBtn, "bg-sun-400 text-ink")}>{busy === v.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}Restore</button>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
