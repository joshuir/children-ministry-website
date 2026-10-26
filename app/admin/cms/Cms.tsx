"use client";

import { isReduced } from "@/lib/motion-pref";
import { StaffPanel } from "./StaffPanel";

import { resolveMap } from "@/lib/map";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { gsap } from "gsap";
import { AlertTriangle, ArrowLeft, Check, CloudOff, Copy, Download, ExternalLink, Loader2, LogOut, Menu, Plus, Save, Search, Undo2, Upload, X } from "lucide-react";
import { LogoMark } from "@/components/ui";
import { Scene } from "@/components/Scene";
import { QRCode } from "@/components/QRCode";
import { fontHref } from "@/lib/typography";
import { BUNDLED_FONTS } from "@/content/pages";
import { embedUrl } from "@/components/SocialEmbeds";
import type { CmsContent } from "@/lib/cms/schema";
import { ALL_SECTIONS, SECTIONS, fillId, type Collection, type Form, type Section } from "./config";
import { CmsCtx, FieldsForm, LibraryModal, RowTools, inputCls, smallBtn, useCms } from "./fields";
import { CommentsPanel, Dashboard, InboxPanel, MediaPanel, VersionsPanel } from "./panels";
import { downloadJson, uploadFile, type Storage } from "./upload";

type Toast = { id: number; m: string; tone: "ok" | "err" };

const viewUrl: Record<string, string> = { lessons: "/classes/", classes: "/classes/", groups: "/classes/", teachers: "/about/#teachers", events: "/events/", posts: "/blog/", socialEmbeds: "/blog/", gallery: "/gallery/", galleryCategories: "/gallery/", home: "/", about: "/about/", contact: "/contact/", socials: "/contact/", app: "/about/#app" };

/* ------------------------------------------------------------------ */

function Thumb({ t }: { t?: { src?: string; scene?: string; tone?: string } }) {
  if (!t) return null;
  return (
    <span className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-paper ring-1 ring-ink/10">
      {t.src ? (/\.(mp4|webm|mov)/i.test(t.src) ? <video src={t.src} muted className="h-full w-full object-cover" /> : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={t.src} alt="" className="h-full w-full object-cover" loading="lazy" />
      )) : t.scene ? <Scene scene={t.scene as any} tone={t.tone as any} className="h-full w-full" /> : <span className={clsx("block h-full w-full", { blue: "bg-brand-500", sun: "bg-sun-400", coral: "bg-coral-400", mint: "bg-mint-400", lilac: "bg-lilac-400", ink: "bg-ink" }[t.tone || "blue"])} />}
    </span>
  );
}

function CollectionEditor({ sec, content, setContent }: { sec: Collection; content: CmsContent; setContent: (fn: (c: CmsContent) => CmsContent) => void }) {
  const list = useMemo(() => (content[sec.path] as any[]) || [], [content, sec.path]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [sel, setSel] = useState<number | null>(null);
  const [bulk, setBulk] = useState<string | null>(null);
  const bulkInput = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const { toast, storage } = useCms();

  useEffect(() => { setSel(null); setQ(""); setFilter(""); }, [sec.id]);
  useEffect(() => { if (sel !== null && formRef.current && !isReduced()) gsap.fromTo(formRef.current, { autoAlpha: 0, x: 16 }, { autoAlpha: 1, x: 0, duration: 0.3, ease: "power2.out" }); }, [sel]);

  const setList = (next: any[]) => setContent((c) => ({ ...c, [sec.path]: next }));
  const rows = list
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => (!filter || sec.filter?.match(item, filter)) && (!q || JSON.stringify(item).toLowerCase().includes(q.toLowerCase())));
  if (sec.sort && !q) rows.sort((a, b) => sec.sort!(a.item, b.item));

  const dupes = useMemo(() => {
    if (!sec.uniqueBy) return new Set<string>();
    const seen = new Map<string, number>();
    list.forEach((x) => { const k = sec.uniqueBy!(x); seen.set(k, (seen.get(k) || 0) + 1); });
    return new Set([...seen].filter(([k, n]) => n > 1 && k && !k.endsWith("/")).map(([k]) => k));
  }, [list, sec]);

  function add() {
    const item = sec.newItem(content);
    setList([item, ...list]);
    setSel(0);
  }
  function update(i: number, v: any) {
    setList(list.map((x, j) => (j === i ? v : x)));
  }
  function remove(i: number) {
    if (!confirm(`Delete “${sec.itemTitle(list[i]) || "this item"}”? You can undo by discarding changes before saving.`)) return;
    setList(list.filter((_, j) => j !== i));
    setSel(null);
  }
  function duplicate(i: number) {
    const copy = JSON.parse(JSON.stringify(list[i]));
    if (copy.id) copy.id = sec.idFrom ? "" : copy.id + "-copy";
    if (sec.idFrom && copy[sec.idFrom]) copy[sec.idFrom] += " (copy)";
    const filled = sec.idFrom ? fillId(sec, copy, list) : copy;
    setList([...list.slice(0, i + 1), filled, ...list.slice(i + 1)]);
    setSel(i + 1);
  }
  function move(i: number, d: -1 | 1) {
    const n = [...list];
    [n[i], n[i + d]] = [n[i + d], n[i]];
    setList(n);
    if (sel === i) setSel(i + d);
  }
  async function bulkUpload(files: FileList | null) {
    if (!files?.length || !sec.bulkUpload) return;
    const made: any[] = [];
    for (const [k, f] of Array.from(files).entries()) {
      setBulk(`Uploading ${k + 1} of ${files.length}…`);
      try {
        const r = await uploadFile(f, sec.id, storage);
        const item = sec.bulkUpload(r.url, f.type.startsWith("video") ? "video" : "image", f.name);
        if (sec.id === "gallery") item.category = filter || content.galleryCategories[0]?.id;
        if (sec.id === "posts") item.authorId = content.teachers[0]?.id;
        made.push(item);
      } catch (e: any) { toast(`${f.name}: ${e.message}`, "err"); }
    }
    setBulk(null);
    if (made.length) { setList([...made, ...list]); setSel(0); toast(`Added ${made.length} item${made.length > 1 ? "s" : ""} — add captions, then save.`); }
  }

  const current = sel !== null ? list[sel] : null;

  return (
    <div className={clsx("grid gap-5", "xl:grid-cols-[minmax(300px,380px)_minmax(0,1fr)]")}>
      {/* List */}
      <div className={clsx("min-w-0", current && "hidden xl:block")}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[160px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${sec.label.toLowerCase()}…`} className={clsx(inputCls, "h-11 pl-9")} />
          </div>
          {sec.filter && (
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className={clsx(inputCls, "h-11 w-auto")} aria-label={`Filter by ${sec.filter.label}`}>
              <option value="">All {sec.filter.label.toLowerCase()}s</option>
              {sec.filter.options(content).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {!sec.fixed && <button type="button" onClick={add} className={clsx(smallBtn, "min-h-[44px] bg-brand-500 px-5 text-white hover:bg-brand-600")}><Plus className="h-4 w-4" />Add new</button>}
          {sec.bulkUpload && <button type="button" onClick={() => bulkInput.current?.click()} className={clsx(smallBtn, "min-h-[44px] bg-white ring-1 ring-ink/10 hover:bg-brand-50")}><Upload className="h-4 w-4" />Upload many</button>}
          <button type="button" onClick={() => downloadJson(list, `${sec.id}.json`)} className={clsx(smallBtn, "min-h-[44px] bg-white ring-1 ring-ink/10 hover:bg-brand-50")} title="Download this list as JSON"><Download className="h-4 w-4" />Export</button>
          <input ref={bulkInput} type="file" multiple hidden accept="image/*,video/*" onChange={(e) => { bulkUpload(e.target.files); e.target.value = ""; }} />
        </div>
        {bulk && <p className="mt-2 flex items-center gap-2 text-sm font-bold text-brand-700"><Loader2 className="h-4 w-4 animate-spin" />{bulk}</p>}
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.08em] text-ink-mute">{rows.length} of {list.length}</p>
        <ul className="mt-2 grid gap-1.5" onDragOver={(e) => sec.bulkUpload && e.preventDefault()} onDrop={(e) => { if (sec.bulkUpload) { e.preventDefault(); bulkUpload(e.dataTransfer.files); } }}>
          {rows.map(({ item, i }) => {
            const dupe = sec.uniqueBy && dupes.has(sec.uniqueBy(item));
            return (
              <li key={i} className={clsx("flex items-center gap-2 rounded-2xl pl-2 pr-1 ring-1 transition-colors duration-100", sel === i ? "bg-brand-50 ring-brand-500" : "bg-white ring-ink/10 hover:bg-paper")}>
                <button type="button" onClick={() => setSel(i)} className="flex min-h-[60px] min-w-0 flex-1 items-center gap-3 py-2 text-left">
                  <Thumb t={sec.thumb?.(item)} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{sec.itemTitle(item) || <i className="text-ink-mute">Untitled</i>}</span>
                    {sec.itemSub && <span className="block truncate text-xs text-ink-mute">{sec.itemSub(item, content)}</span>}
                    {dupe && <span className="mt-0.5 flex items-center gap-1 text-xs font-bold text-coral-600"><AlertTriangle className="h-3.5 w-3.5" />Duplicate ID</span>}
                  </span>
                </button>
                {!sec.fixed && !q && !sec.sort && <RowTools i={i} n={list.length} onMove={(d) => move(i, d)} onRemove={() => remove(i)} />}
              </li>
            );
          })}
          {!rows.length && <li className="rounded-2xl bg-white p-6 text-center text-ink-mute ring-1 ring-ink/10">Nothing found.</li>}
        </ul>
      </div>

      {/* Editor */}
      <div className={clsx("min-w-0", !current && "hidden xl:block")}>
        {current ? (
          <div ref={formRef} className="rounded-3xl bg-white p-4 ring-1 ring-ink/10 sm:p-6">
            <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-ink/10 pb-4">
              <button type="button" onClick={() => setSel(null)} className={clsx(smallBtn, "bg-paper xl:hidden")}><ArrowLeft className="h-4 w-4" />Back</button>
              <h2 className="mr-auto min-w-0 truncate font-display text-xl font-bold">{sec.itemTitle(current) || "New item"}</h2>
              {!sec.fixed && <button type="button" onClick={() => duplicate(sel!)} className={clsx(smallBtn, "bg-white ring-1 ring-ink/10 hover:bg-brand-50")}><Copy className="h-4 w-4" />Duplicate</button>}
              <button type="button" onClick={() => downloadJson(current, `${sec.id}-${current.id || sel}.json`)} className={clsx(smallBtn, "bg-white ring-1 ring-ink/10 hover:bg-brand-50")}><Download className="h-4 w-4" />Download</button>
              {!sec.fixed && <button type="button" onClick={() => remove(sel!)} className={clsx(smallBtn, "bg-coral-100 text-coral-600")}><X className="h-4 w-4" />Delete</button>}
            </div>
            {sec.id === "socialEmbeds" && current.url && (
              <div className="mb-5 overflow-hidden rounded-2xl bg-paper ring-1 ring-ink/10">
                {embedUrl(current) ? <iframe title="Preview" src={embedUrl(current)!} className={clsx("w-full border-0", current.platform === "youtube" ? "aspect-video" : "h-[460px]")} /> : <p className="p-4 text-sm text-ink-mute">This link will show as a card with an “Open post” button.</p>}
              </div>
            )}
            <FieldsForm fields={sec.fields} value={current} onChange={(v) => update(sel!, v)} />
            {sec.idFrom && !current.id && current[sec.idFrom] && (
              <button type="button" onClick={() => update(sel!, fillId(sec, current, list))} className={clsx(smallBtn, "mt-4 bg-paper ring-1 ring-ink/10")}>Generate URL slug from {sec.idFrom}</button>
            )}
          </div>
        ) : (
          <div className="flex h-full min-h-[240px] items-center justify-center rounded-3xl border-2 border-dashed border-ink/10 p-8 text-center text-ink-mute">Choose an item to edit{!sec.fixed && ", or add a new one"}.</div>
        )}
      </div>
    </div>
  );
}

function TypePreview({ t }: { t: any }) {
  const href = fontHref(t);
  const fam = (f: string) => (BUNDLED_FONTS.has(f) ? `"${f} Variable", "${f}"` : `"${f}"`);
  return (
    <aside className="h-fit overflow-hidden rounded-3xl bg-white ring-1 ring-ink/10 xl:sticky xl:top-24">
      {href && <link rel="stylesheet" href={href} />}
      <p className="border-b border-ink/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] text-ink-mute">Live preview</p>
      <div className="p-5">
        <p style={{ fontFamily: fam(t.displayFont), fontWeight: Number(t.headingWeight), fontSize: 34 * Number(t.headingScale || 1), letterSpacing: `${t.letterSpacing}em`, textTransform: t.headingCase === "uppercase" ? "uppercase" : "none", lineHeight: 1 }}>Helping children know God&apos;s Word</p>
        <p className="mt-3 text-ink-soft" style={{ fontFamily: fam(t.bodyFont), fontWeight: Number(t.bodyWeight), fontSize: Number(t.baseSize), lineHeight: 1.55 }}>Every Sunday, children gather in age-based classes to hear Bible stories, sing and pray.</p>
      </div>
    </aside>
  );
}

function MapPreview({ contact }: { contact: { mapQuery?: string; mapEmbed?: string; mapZoom?: number | string; mapLabel?: string } }) {
  const [q, setQ] = useState(contact.mapQuery || "");
  // Wait until typing pauses before reloading the map.
  useEffect(() => { const t = setTimeout(() => setQ(contact.mapQuery || ""), 600); return () => clearTimeout(t); }, [contact.mapQuery]);
  const m = resolveMap(contact.mapEmbed, q || "Accra, Ghana", Number(contact.mapZoom) || 15);
  const label = { embed: "Using your embed code", link: "Using your Google Maps link", coords: "Using your coordinates", search: "Using the map location" }[m.kind];
  return (
    <aside className="h-fit overflow-hidden rounded-3xl bg-white ring-1 ring-ink/10 xl:sticky xl:top-24">
      <p className="border-b border-ink/10 px-5 py-3 text-xs font-bold uppercase tracking-[0.08em] text-ink-mute">Live map preview</p>
      <iframe key={m.src} title="Map preview" src={m.src} className="block h-[260px] w-full border-0 bg-brand-50" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
      <div className="space-y-1.5 p-4 text-sm">
        <p className="font-bold text-ink">{contact.mapLabel || "Map card"}</p>
        <p className="flex items-center gap-1.5 text-ink-soft"><span className={clsx("h-2 w-2 rounded-full", m.note ? "bg-coral-400" : "bg-mint-400")} />{label}</p>
        {m.note && <p className="rounded-xl bg-coral-100 px-3 py-2 text-xs font-semibold text-coral-600">{m.note}</p>}
        <p className="text-xs text-ink-mute">Save to publish it on the Contact page.</p>
      </div>
    </aside>
  );
}

function FormEditor({ sec, content, setContent }: { sec: Form; content: CmsContent; setContent: (fn: (c: CmsContent) => CmsContent) => void }) {
  const value = sec.get(content);
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
      <div className="rounded-3xl bg-white p-4 ring-1 ring-ink/10 sm:p-6">
        <FieldsForm fields={sec.fields} value={value} onChange={(v) => setContent((c) => sec.set(c, v))} />
      </div>
      {sec.preview === "qr" && (
        <aside className="h-fit rounded-3xl bg-white p-5 text-center ring-1 ring-ink/10 xl:sticky xl:top-24">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-ink-mute">{value.qrImage ? "Your QR code" : "Live QR preview"}</p>
          <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3 ring-1 ring-ink/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {value.qrImage ? <img src={value.qrImage} alt="Uploaded QR code" className="h-[180px] w-[180px] object-contain" /> : <QRCode value={value.qrUrl || "https://"} size={180} label="QR code preview" />}
          </div>
          <p className="mt-3 break-all text-xs text-ink-mute">{value.qrImage ? "Shown on the home, about and contact pages." : value.qrUrl}</p>
        </aside>
      )}
      {sec.preview === "type" && <TypePreview t={value} />}
      {sec.preview === "map" && <MapPreview contact={value.contact || {}} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */


export function Cms({ user }: { user: { username: string; name: string; role: "owner" | "editor" } }) {
  const [content, setContentRaw] = useState<CmsContent | null>(null);
  const [etag, setEtag] = useState<string | null>(null);
  const [storage, setStorage] = useState<Storage>("local");
  const [saved, setSaved] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const [conflict, setConflict] = useState<{ content: CmsContent; etag: string } | null>(null);
  const [active, setActive] = useState("dashboard");
  const [nav, setNav] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [library, setLibrary] = useState<{ accept: "image" | "video" | "any"; pick: (u: string) => void } | null>(null);
  const [counts, setCounts] = useState({ pending: 0, unread: 0 });
  const saveBtn = useRef<HTMLButtonElement>(null);

  const toast = useCallback((m: string, tone: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, m, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "err" ? 7000 : 3500);
  }, []);

  const load = useCallback(async () => {
    setLoadError(undefined);
    try {
      const r = await fetch("/api/cms/content", { cache: "no-store" });
      if (r.status === 401) { location.reload(); return; }
      const j = await r.json();
      setContentRaw(j.content); setEtag(j.etag); setStorage(j.storage); setSaved(JSON.stringify(j.content));
    } catch { setLoadError("Couldn't load content. Check your connection and try again."); }
  }, []);

  useEffect(() => {
    load();
    const h = location.hash.slice(1);
    if (ALL_SECTIONS.some((s) => s.id === h)) setActive(h);
    Promise.all([
      fetch("/api/cms/engagement").then((r) => r.json()).catch(() => null),
      fetch("/api/cms/inbox").then((r) => r.json()).catch(() => null),
    ]).then(([e, m]) => setCounts({ pending: e?.comments?.filter((c: any) => c.status === "pending").length || 0, unread: m?.messages?.filter((x: any) => !x.read).length || 0 }));
  }, [load]);

  const dirty = !!content && JSON.stringify(content) !== saved;
  const setContent = useCallback((fn: (c: CmsContent) => CmsContent) => setContentRaw((c) => (c ? fn(c) : c)), []);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useCallback(async (force?: { etag: string }) => {
    if (!content || saving) return;
    setSaving(true);
    try {
      const r = await fetch("/api/cms/content", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content, etag: force ? force.etag : etag }) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 409) { setConflict(j.latest); return; }
      if (r.status === 401) { toast("Your session expired — please sign in again in a new tab, then save.", "err"); return; }
      if (!r.ok) throw new Error(j.error || "Save failed");
      setEtag(j.etag);
      const now = { ...content, updatedAt: j.updatedAt };
      setContentRaw(now); setSaved(JSON.stringify(now));
      toast("Saved — the live site is updating now.");
      if (saveBtn.current && !isReduced()) gsap.fromTo(saveBtn.current, { scale: 0.9 }, { scale: 1, duration: 0.6, ease: "elastic.out(1.2,0.4)" });
    } catch (e: any) {
      toast(e.message || "Save failed", "err");
    } finally {
      setSaving(false);
    }
  }, [content, etag, saving, toast]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [save]);

  function go(id: string) {
    setActive(id); setNav(false);
    history.replaceState(null, "", `#${id}`);
    document.getElementById("cms-main")?.scrollTo({ top: 0 });
    window.scrollTo({ top: 0 });
  }

  async function logout() {
    if (dirty && !confirm("You have unsaved changes. Sign out anyway?")) return;
    await fetch("/api/cms/logout", { method: "POST" });
    location.reload();
  }

  if (!content) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        {loadError ? <><CloudOff className="h-10 w-10 text-coral-600" /><p>{loadError}</p><button onClick={load} className={clsx(smallBtn, "bg-ink text-white")}>Try again</button></> : <><Loader2 className="h-8 w-8 animate-spin text-brand-500" /><p className="text-ink-mute">Loading content…</p></>}
      </div>
    );
  }

  const sec = ALL_SECTIONS.find((s) => s.id === active) as Section;
  const badge = (id: string) => (id === "comments" ? counts.pending : id === "inbox" ? counts.unread : 0);

  return (
    <CmsCtx.Provider value={{ content, storage, toast, openLibrary: (accept, pick) => setLibrary({ accept, pick }) }}>
      <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className={clsx("fixed inset-y-0 left-0 z-40 w-[280px] overflow-y-auto bg-ink p-4 text-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0", nav ? "translate-x-0" : "-translate-x-full")}>
          <div className="flex items-center gap-3 px-2 pb-5 pt-1">
            <LogoMark size={40} />
            <div className="leading-tight"><p className="font-display font-bold">Children&apos;s Ministry</p><p className="text-xs font-bold uppercase tracking-[0.12em] text-white/50">Content manager</p></div>
            <button type="button" onClick={() => setNav(false)} className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/10 lg:hidden" aria-label="Close menu"><X className="h-4 w-4" /></button>
          </div>
          <nav aria-label="CMS sections" className="grid gap-4">
            {SECTIONS.map((g) => (
              <div key={g.title || "top"}>
                {g.title && <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/40">{g.title}</p>}
                <ul className="grid gap-0.5">
                  {g.items.map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => go(s.id)} aria-current={active === s.id ? "page" : undefined}
                        className={clsx("flex min-h-[42px] w-full items-center gap-3 rounded-xl px-3 text-left text-[15px] font-semibold transition-colors duration-100", active === s.id ? "bg-white text-ink" : "text-white/75 hover:bg-white/10 hover:text-white")}>
                        <s.icon className="h-[18px] w-[18px] shrink-0" />{s.label}
                        {badge(s.id) > 0 && <span className="ml-auto rounded-full bg-sun-400 px-2 text-xs font-bold text-ink">{badge(s.id)}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <div className="mt-6 rounded-2xl bg-white/5 p-3 text-xs text-white/60">
            Signed in as <b className="text-white">{user.name}</b> <span className="text-white/40">({user.username}{user.role === "owner" ? ", owner" : ""})</span>
            <button type="button" onClick={logout} className="mt-2 flex items-center gap-2 font-bold text-white hover:text-sun-300"><LogOut className="h-4 w-4" />Sign out</button>
          </div>
        </aside>
        {nav && <div className="fixed inset-0 z-30 bg-ink/50 lg:hidden" onClick={() => setNav(false)} />}

        {/* Main */}
        <div id="cms-main" className="min-w-0">
          <header className="sticky top-0 z-20 flex flex-wrap items-center gap-2 border-b border-ink/10 bg-paper/90 px-4 py-3 backdrop-blur sm:px-6">
            <button type="button" onClick={() => setNav(true)} className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white lg:hidden" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <div className="mr-auto min-w-0">
              <h1 className="truncate font-display text-xl font-bold sm:text-2xl">{sec.label}</h1>
              <p className="hidden truncate text-sm text-ink-mute sm:block">{sec.blurb}</p>
            </div>
            {viewUrl[sec.id] && <a href={viewUrl[sec.id]} target="_blank" rel="noopener noreferrer" className={clsx(smallBtn, "min-h-[44px] bg-white ring-1 ring-ink/10 hover:bg-brand-50")}><ExternalLink className="h-4 w-4" /><span className="hidden sm:inline">View on site</span></a>}
            {dirty && <button type="button" onClick={() => confirm("Discard all unsaved changes?") && setContentRaw(JSON.parse(saved))} className={clsx(smallBtn, "min-h-[44px] bg-white ring-1 ring-ink/10 hover:bg-coral-100")}><Undo2 className="h-4 w-4" /><span className="hidden sm:inline">Discard</span></button>}
            <button ref={saveBtn} type="button" onClick={() => save()} disabled={!dirty || saving} className={clsx("inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 font-display font-semibold transition-colors duration-100", dirty ? "bg-brand-500 text-white shadow-[0_3px_0_0_#173EA8] hover:bg-brand-600" : "bg-white text-ink-mute ring-1 ring-ink/10")}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : dirty ? <Save className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              {saving ? "Saving…" : dirty ? "Save & publish" : "All saved"}
            </button>
          </header>
          {storage === "local" && <p className="mx-4 mt-4 rounded-2xl bg-sun-100 px-4 py-2.5 text-sm font-semibold text-sun-600 sm:mx-6">Local mode: changes are stored on this computer (.data folder). On Vercel with Blob storage connected, they&apos;re saved to the cloud.</p>}
          <main className="p-4 sm:p-6">
            {sec.kind === "collection" && <CollectionEditor key={sec.id} sec={sec} content={content} setContent={setContent} />}
            {sec.kind === "form" && <FormEditor sec={sec} content={content} setContent={setContent} />}
            {sec.kind === "panel" && sec.id === "dashboard" && <Dashboard content={content} go={go} counts={counts} />}
            {sec.kind === "panel" && sec.id === "media" && <MediaPanel content={content} />}
            {sec.kind === "panel" && sec.id === "comments" && <CommentsPanel content={content} onCount={(n) => setCounts((c) => ({ ...c, pending: n }))} />}
            {sec.kind === "panel" && sec.id === "inbox" && <InboxPanel onCount={(n) => setCounts((c) => ({ ...c, unread: n }))} />}
            {sec.kind === "panel" && sec.id === "staff" && <StaffPanel />}
            {sec.kind === "panel" && sec.id === "versions" && <VersionsPanel content={content} onRestore={(c, e) => { setContentRaw(c); setEtag(e); setSaved(JSON.stringify(c)); }} onImport={(c) => setContentRaw(c)} />}
          </main>
        </div>
      </div>

      {library && <LibraryModal accept={library.accept} onPick={library.pick} onClose={() => setLibrary(null)} />}

      {conflict && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-ink/60 p-4">
          <div role="alertdialog" aria-modal="true" aria-labelledby="conflict-title" className="max-w-md rounded-3xl bg-white p-6">
            <AlertTriangle className="h-8 w-8 text-sun-600" />
            <h2 id="conflict-title" className="mt-3 font-display text-2xl font-bold">Someone else just saved</h2>
            <p className="mt-2 text-ink-mute">Another editor published changes while you were working. Load theirs (your unsaved edits will be lost), or publish yours over the top.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => { setContentRaw(conflict.content); setEtag(conflict.etag); setSaved(JSON.stringify(conflict.content)); setConflict(null); }} className={clsx(smallBtn, "min-h-[44px] bg-ink px-5 text-white")}>Load their version</button>
              <button type="button" onClick={() => { const e = conflict.etag; setConflict(null); save({ etag: e }); }} className={clsx(smallBtn, "min-h-[44px] bg-coral-100 px-5 text-coral-600")}>Publish mine anyway</button>
            </div>
          </div>
        </div>
      )}

      <div aria-live="polite" className="pointer-events-none fixed bottom-4 left-1/2 z-[100] grid w-[min(92vw,420px)] -translate-x-1/2 gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={clsx("pointer-events-auto flex items-start gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lift animate-[menu-in_.2s_ease-out]", t.tone === "err" ? "bg-coral-600 text-white" : "bg-ink text-white")}>
            {t.tone === "err" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <Check className="mt-0.5 h-4 w-4 shrink-0 text-sun-300" />}{t.m}
          </div>
        ))}
      </div>
    </CmsCtx.Provider>
  );
}
