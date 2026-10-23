"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import { ArrowDown, ArrowUp, Copy, Download, FolderOpen, ImagePlus, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { Scene } from "@/components/Scene";
import type { CmsContent } from "@/lib/cms/schema";
import { fmtBytes, isImage, isVideo, uploadFile, type Storage } from "./upload";

/* ------------------------------------------------------------------ */
/* Field definitions                                                  */
/* ------------------------------------------------------------------ */

export type Opt = { value: string; label: string };
type Base = { k: string; label: string; help?: string; wide?: boolean; required?: boolean };
export type Field = Base & (
  | { type: "text" | "url" | "email" | "date" | "time" | "datetime" | "number"; placeholder?: string }
  | { type: "textarea"; rows?: number; placeholder?: string }
  | { type: "paragraphs" }
  | { type: "select"; options: Opt[] | ((c: CmsContent) => Opt[]) }
  | { type: "multiselect"; options: Opt[] | ((c: CmsContent) => Opt[]) }
  | { type: "checkbox" }
  | { type: "media"; accept?: "image" | "video" | "any"; folder?: string }
  | { type: "image"; folder?: string }
  | { type: "file"; folder?: string }
  | { type: "strings"; itemLabel?: string }
  | { type: "group"; fields: Field[] }
  | { type: "list"; fields: Field[]; itemTitle: (v: any, i: number) => string; newItem: () => any; max?: number }
);

/* ------------------------------------------------------------------ */
/* Shared context: content (for dynamic options), storage, library    */
/* ------------------------------------------------------------------ */

interface Ctx { content: CmsContent; storage: Storage; openLibrary: (accept: "image" | "video" | "any", pick: (url: string) => void) => void; toast: (m: string, tone?: "ok" | "err") => void }
export const CmsCtx = createContext<Ctx>(null as never);
export const useCms = () => useContext(CmsCtx);

/* ------------------------------------------------------------------ */
/* Primitives                                                         */
/* ------------------------------------------------------------------ */

export const inputCls = "w-full rounded-xl bg-white px-3.5 text-[15px] text-ink outline-none ring-1 ring-ink/15 transition-shadow duration-100 placeholder:text-ink-mute/70 focus:ring-2 focus:ring-brand-500";
export const smallBtn = "inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-3 text-sm font-bold transition-colors duration-100";

export function Label({ children, htmlFor, help, required }: { children: ReactNode; htmlFor?: string; help?: string; required?: boolean }) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="text-sm font-bold text-ink">{children}{required && <span className="text-coral-600"> *</span>}</label>
      {help && <p className="text-xs text-ink-mute">{help}</p>}
    </div>
  );
}

const uid = () => Math.random().toString(36).slice(2, 9);

function useUpload(folder: string) {
  const { storage, toast } = useCms();
  const [pct, setPct] = useState<number | null>(null);
  async function run(file: File): Promise<string | null> {
    setPct(0);
    try {
      const r = await uploadFile(file, folder, storage, setPct);
      toast(`Uploaded ${r.name} (${fmtBytes(r.size)})`);
      return r.url;
    } catch (e: any) {
      toast(e?.message || "Upload failed", "err");
      return null;
    } finally {
      setPct(null);
    }
  }
  return { pct, run };
}

function Progress({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2 text-sm font-bold text-brand-700">
      <Loader2 className="h-4 w-4 animate-spin" />Uploading {pct}%
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-brand-100"><span className="block h-full bg-brand-500 transition-[width]" style={{ width: `${pct}%` }} /></span>
    </div>
  );
}

/** Image / video / file chooser: upload, pick from library, download, remove. */
export function AssetInput({ value, onChange, accept = "any", folder = "uploads", id }: { value?: string; onChange: (url: string | undefined) => void; accept?: "image" | "video" | "any" | "file"; folder?: string; id?: string }) {
  const { openLibrary } = useCms();
  const file = useRef<HTMLInputElement>(null);
  const { pct, run } = useUpload(folder);
  const [drag, setDrag] = useState(false);
  const acceptAttr = accept === "image" ? "image/*" : accept === "video" ? "video/*" : accept === "file" ? "application/pdf,image/*,audio/*,video/*,.doc,.docx,.ppt,.pptx" : "image/*,video/*";

  async function onFiles(list: FileList | null) {
    const f = list?.[0];
    if (!f) return;
    const url = await run(f);
    if (url) onChange(url);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}
      className={clsx("rounded-2xl border-2 border-dashed p-3 transition-colors duration-100", drag ? "border-brand-500 bg-brand-50" : "border-ink/10 bg-paper")}
    >
      {value ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl bg-ink/5 sm:w-36">
            {isVideo(value) ? <video src={value} className="h-full w-full object-cover" muted /> : isImage(value) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="" className="h-full w-full object-cover" />
            ) : <span className="flex h-full items-center justify-center text-xs font-bold text-ink-mute">FILE</span>}
          </div>
          <div className="min-w-0 flex-1">
            <input id={id} value={value} onChange={(e) => onChange(e.target.value || undefined)} className={clsx(inputCls, "h-10 text-xs")} aria-label="File URL" />
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" onClick={() => file.current?.click()} className={clsx(smallBtn, "bg-white ring-1 ring-ink/10 hover:bg-brand-50")}><Upload className="h-4 w-4" />Replace</button>
              <a href={value} download target="_blank" rel="noopener noreferrer" className={clsx(smallBtn, "bg-white ring-1 ring-ink/10 hover:bg-brand-50")}><Download className="h-4 w-4" />Download</a>
              <button type="button" onClick={() => onChange(undefined)} className={clsx(smallBtn, "text-coral-600 hover:bg-coral-100")}><X className="h-4 w-4" />Remove</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => file.current?.click()} className={clsx(smallBtn, "bg-brand-500 text-white hover:bg-brand-600")}><ImagePlus className="h-4 w-4" />Upload {accept === "file" ? "file" : accept === "video" ? "video" : accept === "image" ? "photo" : "photo or video"}</button>
          {accept !== "file" && <button type="button" onClick={() => openLibrary(accept as "image" | "video" | "any", (u) => onChange(u))} className={clsx(smallBtn, "bg-white ring-1 ring-ink/10 hover:bg-brand-50")}><FolderOpen className="h-4 w-4" />Media library</button>}
          <span className="text-xs text-ink-mute">or drop a file here</span>
          <input value="" onChange={(e) => onChange(e.target.value || undefined)} placeholder="…or paste a link" className={clsx(inputCls, "h-9 min-w-[160px] flex-1 text-sm")} aria-label="Paste a file link" />
        </div>
      )}
      {pct !== null && <div className="mt-2"><Progress pct={pct} /></div>}
      <input ref={file} type="file" hidden accept={acceptAttr} onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
    </div>
  );
}

const SCENES = ["worship", "bible", "harvest", "parents", "graduation", "hosanna", "evangelism", "excursion", "camping", "craft", "prayer", "music", "app", "sunrise"];
export const TONES: Opt[] = [{ value: "blue", label: "Blue" }, { value: "sun", label: "Sun (yellow)" }, { value: "coral", label: "Coral" }, { value: "mint", label: "Sky blue" }, { value: "lilac", label: "Navy" }, { value: "ink", label: "Black" }];
export const SCENE_OPTS: Opt[] = SCENES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }));

function MediaInput({ value, onChange, accept, folder }: { value: any; onChange: (v: any) => void; accept: "image" | "video" | "any"; folder: string }) {
  const v = value || { alt: "" };
  return (
    <div className="grid gap-3 rounded-2xl bg-white p-3 ring-1 ring-ink/10">
      <AssetInput value={v.src} accept={accept} folder={folder} onChange={(src) => onChange({ ...v, src })} />
      <div className="grid gap-3 sm:grid-cols-[1fr_140px_140px]">
        <div><Label help="Describe the picture for screen readers.">Alt text</Label><input value={v.alt || ""} onChange={(e) => onChange({ ...v, alt: e.target.value })} className={clsx(inputCls, "h-10")} /></div>
        <div><Label>Illustration</Label><select value={v.scene || ""} onChange={(e) => onChange({ ...v, scene: e.target.value || undefined })} className={clsx(inputCls, "h-10")}><option value="">—</option>{SCENE_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
        <div><Label>Colour</Label><select value={v.tone || ""} onChange={(e) => onChange({ ...v, tone: e.target.value || undefined })} className={clsx(inputCls, "h-10")}><option value="">—</option>{TONES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
      </div>
      {!v.src && v.scene && <div className="flex items-center gap-3 text-xs text-ink-mute"><div className="h-14 w-20 overflow-hidden rounded-lg"><Scene scene={v.scene} tone={v.tone} className="h-full w-full" /></div>No photo yet — this illustration shows instead.</div>}
    </div>
  );
}

function Strings({ value, onChange, itemLabel = "Item" }: { value: string[]; onChange: (v: string[]) => void; itemLabel?: string }) {
  const list = value || [];
  return (
    <div className="grid gap-2">
      {list.map((s, i) => (
        <div key={i} className="flex items-start gap-2">
          <textarea value={s} rows={s.length > 90 ? 3 : 1} onChange={(e) => onChange(list.map((x, j) => (j === i ? e.target.value : x)))} className={clsx(inputCls, "min-h-[40px] py-2")} aria-label={`${itemLabel} ${i + 1}`} />
          <RowTools i={i} n={list.length} onMove={(d) => { const n = [...list]; [n[i], n[i + d]] = [n[i + d], n[i]]; onChange(n); }} onRemove={() => onChange(list.filter((_, j) => j !== i))} />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, ""])} className={clsx(smallBtn, "w-fit bg-paper ring-1 ring-ink/10 hover:bg-brand-50")}><Plus className="h-4 w-4" />Add {itemLabel.toLowerCase()}</button>
    </div>
  );
}

export function RowTools({ i, n, onMove, onRemove, onDuplicate }: { i: number; n: number; onMove: (d: -1 | 1) => void; onRemove: () => void; onDuplicate?: () => void }) {
  const b = "flex h-9 w-9 items-center justify-center rounded-full text-ink-mute transition-colors duration-100 hover:bg-ink/5 hover:text-ink disabled:opacity-30";
  return (
    <div className="flex shrink-0 items-center">
      <button type="button" className={b} disabled={i === 0} onClick={() => onMove(-1)} aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
      <button type="button" className={b} disabled={i === n - 1} onClick={() => onMove(1)} aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
      {onDuplicate && <button type="button" className={b} onClick={onDuplicate} aria-label="Duplicate"><Copy className="h-4 w-4" /></button>}
      <button type="button" className={clsx(b, "hover:!bg-coral-100 hover:!text-coral-600")} onClick={onRemove} aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

function ListField({ f, value, onChange }: { f: Extract<Field, { type: "list" }>; value: any[]; onChange: (v: any[]) => void }) {
  const list = value || [];
  const [open, setOpen] = useState<number | null>(list.length === 1 ? 0 : null);
  return (
    <div className="grid gap-2">
      {list.map((item, i) => (
        <div key={i} className="rounded-2xl bg-paper ring-1 ring-ink/10">
          <div className="flex items-center gap-2 pl-4 pr-1">
            <button type="button" onClick={() => setOpen(open === i ? null : i)} className="min-h-[44px] flex-1 truncate text-left text-[15px] font-semibold" aria-expanded={open === i}>{f.itemTitle(item, i) || <span className="text-ink-mute">Untitled</span>}</button>
            <RowTools i={i} n={list.length}
              onMove={(d) => { const n = [...list]; [n[i], n[i + d]] = [n[i + d], n[i]]; onChange(n); setOpen(open === i ? i + d : open); }}
              onRemove={() => { if (confirm("Delete this item?")) { onChange(list.filter((_, j) => j !== i)); setOpen(null); } }} />
          </div>
          {open === i && <div className="border-t border-ink/10 p-4"><FieldsForm fields={f.fields} value={item} onChange={(v) => onChange(list.map((x, j) => (j === i ? v : x)))} /></div>}
        </div>
      ))}
      {(!f.max || list.length < f.max) && (
        <button type="button" onClick={() => { onChange([...list, f.newItem()]); setOpen(list.length); }} className={clsx(smallBtn, "w-fit bg-white ring-1 ring-ink/10 hover:bg-brand-50")}><Plus className="h-4 w-4" />Add</button>
      )}
    </div>
  );
}

function Multi({ options, value, onChange }: { options: Opt[]; value: string[]; onChange: (v: string[]) => void }) {
  const v = value || [];
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = v.includes(o.value);
        return <button key={o.value} type="button" aria-pressed={on} onClick={() => onChange(on ? v.filter((x) => x !== o.value) : [...v, o.value])} className={clsx(smallBtn, on ? "bg-brand-500 text-white" : "bg-white ring-1 ring-ink/10 hover:bg-brand-50")}>{o.label}</button>;
      })}
    </div>
  );
}

const toLocalInput = (iso?: string) => (iso ? iso.slice(0, 16) : "");

export function FieldInput({ f, value, onChange }: { f: Field; value: any; onChange: (v: any) => void }) {
  const { content } = useCms();
  const id = useRef("f" + uid()).current;
  let control: ReactNode;
  switch (f.type) {
    case "textarea":
      control = <textarea id={id} rows={f.rows || 4} value={value ?? ""} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} className={clsx(inputCls, "py-2.5 leading-relaxed")} />;
      break;
    case "paragraphs":
      control = <textarea id={id} rows={8} value={(value || []).join("\n\n")} onChange={(e) => onChange(e.target.value.split(/\n\s*\n/))} className={clsx(inputCls, "py-2.5 leading-relaxed")} />;
      break;
    case "number":
      control = <input id={id} type="number" value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} className={clsx(inputCls, "h-11")} />;
      break;
    case "datetime":
      control = <input id={id} type="datetime-local" value={toLocalInput(value)} onChange={(e) => onChange(e.target.value ? new Date(e.target.value + "Z").toISOString() : "")} className={clsx(inputCls, "h-11")} />;
      break;
    case "select": {
      const opts = typeof f.options === "function" ? f.options(content) : f.options;
      control = <select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} className={clsx(inputCls, "h-11")}><option value="">—</option>{opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
      break;
    }
    case "multiselect":
      control = <Multi options={typeof f.options === "function" ? f.options(content) : f.options} value={value} onChange={onChange} />;
      break;
    case "checkbox":
      return (
        <label className={clsx("flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl bg-paper px-3.5 font-semibold", f.wide && "sm:col-span-2")}>
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-brand-500" />{f.label}
          {f.help && <span className="text-xs font-normal text-ink-mute">— {f.help}</span>}
        </label>
      );
    case "media":
      control = <MediaInput value={value} onChange={onChange} accept={f.accept || "any"} folder={f.folder || "uploads"} />;
      break;
    case "image":
      control = <AssetInput id={id} value={value} onChange={onChange} accept="image" folder={f.folder || "uploads"} />;
      break;
    case "file":
      control = <AssetInput id={id} value={value} onChange={onChange} accept="file" folder={f.folder || "files"} />;
      break;
    case "strings":
      control = <Strings value={value} onChange={onChange} itemLabel={f.itemLabel} />;
      break;
    case "group":
      control = <div className="rounded-2xl bg-paper/60 p-4 ring-1 ring-ink/10"><FieldsForm fields={f.fields} value={value || {}} onChange={onChange} /></div>;
      break;
    case "list":
      control = <ListField f={f} value={value} onChange={onChange} />;
      break;
    default:
      control = <input id={id} type={f.type === "url" ? "url" : f.type === "email" ? "email" : f.type === "date" ? "date" : "text"} value={value ?? ""} placeholder={"placeholder" in f ? f.placeholder : undefined} onChange={(e) => onChange(e.target.value)} className={clsx(inputCls, "h-11")} />;
  }
  const full = f.wide || ["textarea", "paragraphs", "media", "image", "file", "strings", "group", "list", "multiselect"].includes(f.type);
  const missing = f.required && (value === undefined || value === "" || (Array.isArray(value) && !value.length));
  return (
    <div className={clsx(full && "sm:col-span-2")}>
      <Label htmlFor={id} help={f.help} required={f.required}>{f.label}</Label>
      {control}
      {missing && <p className="mt-1 text-xs font-bold text-coral-600">Required</p>}
    </div>
  );
}

export function FieldsForm({ fields, value, onChange }: { fields: Field[]; value: any; onChange: (v: any) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => <FieldInput key={f.k} f={f} value={value?.[f.k]} onChange={(v) => onChange({ ...value, [f.k]: v })} />)}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Media library modal                                                */
/* ------------------------------------------------------------------ */

export interface MediaFile { url: string; pathname: string; size: number; uploadedAt: string; downloadUrl: string }

export function useMediaList() {
  const [files, setFiles] = useState<MediaFile[] | null>(null);
  const [error, setError] = useState<string>();
  async function reload() {
    setError(undefined);
    try {
      const r = await fetch("/api/cms/media", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setFiles(j.files);
    } catch (e: any) { setError(e?.message || "Couldn't load media"); setFiles([]); }
  }
  useEffect(() => { reload(); }, []);
  return { files, error, reload, setFiles };
}

export function LibraryModal({ accept, onPick, onClose }: { accept: "image" | "video" | "any"; onPick: (url: string) => void; onClose: () => void }) {
  const { files, reload } = useMediaList();
  const [q, setQ] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const { pct, run } = useUpload("library");
  const list = (files || []).filter((f) => (accept === "any" ? isImage(f.url) || isVideo(f.url) : accept === "image" ? isImage(f.url) : isVideo(f.url)) && f.pathname.toLowerCase().includes(q.toLowerCase()));
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Media library" className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-t-3xl bg-white sm:rounded-3xl">
        <div className="flex flex-wrap items-center gap-2 border-b border-ink/10 p-4">
          <h2 className="mr-auto font-display text-xl font-bold">Choose from library</h2>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className={clsx(inputCls, "h-10 w-40")} />
          <button type="button" onClick={() => file.current?.click()} className={clsx(smallBtn, "bg-brand-500 text-white")}><Upload className="h-4 w-4" />Upload</button>
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white"><X className="h-5 w-5" /></button>
          <input ref={file} type="file" hidden accept={accept === "image" ? "image/*" : accept === "video" ? "video/*" : "image/*,video/*"} onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const u = await run(f); if (u) { onPick(u); onClose(); } } reload(); }} />
        </div>
        {pct !== null && <div className="px-4 pt-3"><Progress pct={pct} /></div>}
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-4">
          {files === null && <p className="col-span-full flex items-center gap-2 text-ink-mute"><Loader2 className="h-4 w-4 animate-spin" />Loading…</p>}
          {files && !list.length && <p className="col-span-full text-ink-mute">Nothing here yet — upload something.</p>}
          {list.map((f) => (
            <button key={f.url} type="button" onClick={() => { onPick(f.url); onClose(); }} className="group overflow-hidden rounded-2xl bg-paper text-left ring-1 ring-ink/10 transition-shadow duration-100 hover:ring-2 hover:ring-brand-500">
              <div className="aspect-[4/3] bg-ink/5">{isVideo(f.url) ? <video src={f.url} muted className="h-full w-full object-cover" /> : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.url} alt="" loading="lazy" className="h-full w-full object-cover" />
              )}</div>
              <p className="truncate px-2.5 py-2 text-xs font-semibold">{f.pathname.split("/").pop()}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
