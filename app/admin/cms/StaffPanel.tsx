"use client";

import { useEffect, useState, type FormEvent } from "react";
import clsx from "clsx";
import { KeyRound, Loader2, ShieldCheck, Trash2, UserPlus, UserX, UserCheck } from "lucide-react";
import { smallBtn, inputCls, useCms } from "./fields";

const card = "rounded-3xl bg-white p-5 ring-1 ring-ink/10";
interface Acc { username: string; name: string; role: "owner" | "editor"; disabled?: boolean; createdAt?: string; createdBy?: string; fromEnv?: boolean }
interface Me { username: string; name: string; role: "owner" | "editor" }

async function api(method: string, payload?: unknown) {
  const r = await fetch("/api/cms/staff", { method, headers: { "Content-Type": "application/json" }, body: payload ? JSON.stringify(payload) : undefined, cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (r.status === 401 && method === "GET") location.reload();
  if (!r.ok) throw new Error(j.error || "Request failed");
  return j;
}

/** A strong random password the owner can hand over (they should change it after signing in). */
function suggest() {
  const a = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const b = crypto.getRandomValues(new Uint32Array(16));
  return Array.from(b, (n) => a[n % a.length]).join("").replace(/(.{4})(?!$)/g, "$1-");
}

export function StaffPanel() {
  const { toast } = useCms();
  const [me, setMe] = useState<Me | null>(null);
  const [list, setList] = useState<Acc[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ username: "", name: "", password: "" });
  const [mine, setMine] = useState({ currentPassword: "", newPassword: "" });

  const load = () => api("GET").then((j) => { setMe(j.me); setList(j.accounts); }).catch((e) => toast(e.message, "err"));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try { await fn(); toast(ok); await load(); return true; } catch (e: any) { toast(e.message, "err"); return false; } finally { setBusy(false); }
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    if (await run(() => api("POST", form), `Account created for ${form.name}. Share the username and password with them privately.`)) setForm({ username: "", name: "", password: "" });
  }

  async function changeMine(e: FormEvent) {
    e.preventDefault();
    if (await run(() => api("PATCH", { self: true, ...mine }), "Password changed. Please sign in again.")) setTimeout(() => location.reload(), 1200);
  }

  if (!me) return <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>;

  if (me.role !== "owner") {
    return (
      <form onSubmit={changeMine} className={clsx(card, "max-w-lg")}>
        <h2 className="font-display text-xl font-bold">Change my password</h2>
        <p className="mt-1 text-sm text-ink-mute">Signed in as <b>{me.username}</b>. Changing your password signs you out on every device.</p>
        <label htmlFor="cur-pw" className="mt-5 block text-sm font-bold">Current password</label>
        <input id="cur-pw" type="password" autoComplete="current-password" required value={mine.currentPassword} onChange={(e) => setMine({ ...mine, currentPassword: e.target.value })} className={clsx(inputCls, "mt-1.5")} />
        <label htmlFor="new-pw" className="mt-4 block text-sm font-bold">New password <span className="font-normal text-ink-mute">(12+ characters)</span></label>
        <input id="new-pw" type="password" autoComplete="new-password" required minLength={12} value={mine.newPassword} onChange={(e) => setMine({ ...mine, newPassword: e.target.value })} className={clsx(inputCls, "mt-1.5")} />
        <button type="submit" disabled={busy} className={clsx(smallBtn, "mt-5 min-h-[44px] bg-ink px-5 text-white")}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}Change password</button>
      </form>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <section className={card} aria-labelledby="acc-title">
        <h2 id="acc-title" className="font-display text-xl font-bold">Who can sign in</h2>
        <p className="mt-1 text-sm text-ink-mute">Only these people can open the content manager. Each needs their own username and password.</p>
        <ul className="mt-4 divide-y divide-ink/[0.07]">
          {list.map((a) => (
            <li key={a.username} className="flex flex-wrap items-center gap-3 py-3">
              <div className="mr-auto min-w-0">
                <p className="font-bold">{a.name} {a.disabled && <span className="ml-1 rounded-full bg-coral-100 px-2 py-0.5 text-xs font-bold text-coral-600">Disabled</span>}</p>
                <p className="text-sm text-ink-mute">{a.username} · {a.role === "owner" ? "Owner" : "Editor"}{a.createdBy ? ` · added by ${a.createdBy}` : ""}</p>
              </div>
              {a.role === "owner" ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-mute"><ShieldCheck className="h-4 w-4 text-mint-600" />Set in Vercel</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  <button type="button" disabled={busy} className={clsx(smallBtn, "bg-white ring-1 ring-ink/10 hover:bg-brand-50")} onClick={() => {
                    const pw = prompt(`New password for ${a.name} (12+ characters). Leave as suggested or type your own:`, suggest());
                    if (pw) run(() => api("PATCH", { username: a.username, password: pw }), `Password reset. ${a.name} has been signed out everywhere.`);
                  }}><KeyRound className="h-4 w-4" />Reset password</button>
                  <button type="button" disabled={busy} className={clsx(smallBtn, "bg-white ring-1 ring-ink/10 hover:bg-sun-100")} onClick={() => run(() => api("PATCH", { username: a.username, disabled: !a.disabled }), a.disabled ? "Account enabled." : `${a.name} can no longer sign in.`)}>
                    {a.disabled ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}{a.disabled ? "Enable" : "Disable"}
                  </button>
                  <button type="button" disabled={busy} aria-label={`Remove ${a.name}`} className={clsx(smallBtn, "bg-white ring-1 ring-ink/10 hover:bg-coral-100 hover:text-coral-600")} onClick={() => confirm(`Remove ${a.name}'s account? They'll be signed out immediately.`) && run(() => api("DELETE", { username: a.username }), "Account removed.")}><Trash2 className="h-4 w-4" /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={add} className={clsx(card, "self-start")} aria-labelledby="add-title">
        <h2 id="add-title" className="font-display text-xl font-bold">Add a staff member</h2>
        <label htmlFor="st-name" className="mt-4 block text-sm font-bold">Full name</label>
        <input id="st-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={clsx(inputCls, "mt-1.5")} />
        <label htmlFor="st-user" className="mt-4 block text-sm font-bold">Username</label>
        <input id="st-user" required pattern="[a-z0-9][a-z0-9._\-]{2,31}" autoCapitalize="none" autoComplete="off" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, "") })} className={clsx(inputCls, "mt-1.5")} />
        <p className="mt-1 text-xs text-ink-mute">3–32 characters: lowercase letters, numbers, dots, dashes.</p>
        <label htmlFor="st-pw" className="mt-4 block text-sm font-bold">Starting password</label>
        <div className="mt-1.5 flex gap-2">
          <input id="st-pw" required minLength={12} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={clsx(inputCls, "min-w-0 flex-1 font-mono")} />
          <button type="button" onClick={() => setForm({ ...form, password: suggest() })} className={clsx(smallBtn, "shrink-0 bg-white ring-1 ring-ink/10 hover:bg-brand-50")}>Suggest</button>
        </div>
        <p className="mt-1 text-xs text-ink-mute">At least 12 characters. Ask them to change it after their first sign-in.</p>
        <button type="submit" disabled={busy} className={clsx(smallBtn, "mt-5 min-h-[44px] bg-ink px-5 text-white")}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}Create account</button>
      </form>
    </div>
  );
}
