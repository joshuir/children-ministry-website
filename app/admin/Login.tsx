"use client";

import { useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { LogoMark, buttonClass } from "@/components/ui";
import { shake } from "@/components/Motion";

export function Login() {
  const [pw, setPw] = useState("");
  const [username, setUsername] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string>();
  const form = useRef<HTMLFormElement>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(undefined);
    try {
      const r = await fetch("/api/cms/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: username.trim().toLowerCase(), password: pw }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Couldn't sign in.");
      location.reload();
    } catch (e: any) {
      setErr(e.message); shake(form.current); setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink p-4">
      <form ref={form} onSubmit={submit} className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-lift sm:p-8">
        <div className="flex items-center gap-3"><LogoMark size={48} /><div><p className="font-display text-lg font-bold leading-tight">Content manager</p><p className="text-sm text-ink-mute">Children&apos;s Ministry</p></div></div>
        <label htmlFor="cms-user" className="mt-7 block text-sm font-bold">Username</label>
        <input id="cms-user" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} required autoFocus aria-invalid={!!err} className="mt-1.5 h-12 w-full rounded-xl px-4 ring-1 ring-ink/15 outline-none focus:ring-2 focus:ring-brand-500" />
        <label htmlFor="cms-pw" className="mt-4 block text-sm font-bold">Password</label>
        <div className="relative mt-1.5">
          <input id="cms-pw" type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required aria-invalid={!!err} aria-describedby={err ? "cms-err" : undefined} className="h-12 w-full rounded-xl px-4 pr-12 ring-1 ring-ink/15 outline-none focus:ring-2 focus:ring-brand-500" />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded-lg text-ink-mute hover:text-ink">{show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
        </div>
        {err && <p id="cms-err" role="alert" className="mt-3 rounded-xl bg-coral-100 px-3 py-2 text-sm font-semibold text-coral-600">{err}</p>}
        <button type="submit" disabled={busy || !pw || !username.trim()} className={buttonClass("primary", "lg") + " mt-6 w-full"}>{busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}Sign in</button>
        <p className="mt-4 text-center text-xs text-ink-mute">Staff only. Forgotten your password? Ask the site owner to reset it.</p>
      </form>
    </div>
  );
}
