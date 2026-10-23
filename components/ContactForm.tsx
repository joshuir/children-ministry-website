"use client";

import { useRef, useState, type FormEvent, useEffect } from "react";
import clsx from "clsx";
import { celebrate, shake } from "./Motion";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { buttonClass } from "./ui";
import { clean, markSent, spamCheck, submitRpc, validators, type FieldErrors } from "@/lib/forms";

type Field = "name" | "email" | "phone" | "subject" | "message";
const subjects = ["Visiting for the first time", "Registering my child", "Volunteering as a teacher", "Safeguarding concern", "Prayer request", "Something else"];

export function ContactForm() {
  const opened = useRef(Date.now());
  const [v, setV] = useState<Record<Field, string>>({ name: "", email: "", phone: "", subject: "", message: "" });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const [nudge, setNudge] = useState(0);
  useEffect(() => { if (status === "done") celebrate(doneRef.current); if (status === "error") shake(formRef.current); }, [status]);
  useEffect(() => { if (nudge) shake(formRef.current); }, [nudge]);
  const [msg, setMsg] = useState("");

  const validate = (x = v): FieldErrors<Field> => ({
    name: validators.required(x.name, "full name") ?? validators.max(x.name, 80, "Name"),
    email: validators.email(x.email),
    phone: validators.phone(x.phone),
    subject: x.subject ? undefined : "Please choose a subject.",
    message: validators.min(x.message, 10, "Your message") ?? validators.max(x.message, 2000, "Your message"),
  });

  const set = (f: Field, val: string) => {
    const next = { ...v, [f]: val };
    setV(next);
    if (touched[f]) setErrors((e) => ({ ...e, [f]: validate(next)[f] }));
  };
  const blur = (f: Field) => { setTouched((t) => ({ ...t, [f]: true })); setErrors((e) => ({ ...e, [f]: validate()[f] })); };

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    setTouched({ name: true, email: true, phone: true, subject: true, message: true });
    const first = (Object.keys(errs) as Field[]).find((k) => errs[k]);
    if (first) { document.getElementById(`cf-${first}`)?.focus(); setNudge((n) => n + 1); return; }
    const spam = spamCheck(e.currentTarget, opened.current, "contact");
    if (spam === "spam") { setStatus("done"); return; }
    if (spam) { setStatus("error"); setMsg(spam); return; }
    setStatus("sending");
    const res = await submitRpc("submit_contact", {
      p_name: clean(v.name, 80), p_email: clean(v.email, 160).toLowerCase(), p_phone: clean(v.phone, 20), p_subject: clean(v.subject, 80), p_message: clean(v.message, 2000),
    });
    if (res.ok) { markSent("contact"); setStatus("done"); }
    else { setStatus("error"); setMsg(res.message); }
  }

  if (status === "done") {
    return (
      <div ref={doneRef} role="status" className="flex flex-col items-center rounded-4xl bg-mint-100 px-6 py-14 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-mint-400"><CheckCircle2 className="h-8 w-8 text-ink" /></span>
        <h3 className="mt-5 font-display text-3xl font-semibold">Thank you, {v.name.split(" ")[0] || "friend"}!</h3>
        <p className="mt-2 max-w-md text-ink-soft">Your message is with our children&apos;s ministry team. We usually reply within two working days{v.subject === "Safeguarding concern" ? " — safeguarding messages go straight to our Safeguarding Lead and are handled the same day" : ""}.</p>
        <button type="button" className={clsx(buttonClass("light"), "mt-6")} onClick={() => { setV({ name: "", email: "", phone: "", subject: "", message: "" }); setTouched({}); setErrors({}); setStatus("idle"); opened.current = Date.now(); }}>Send another message</button>
      </div>
    );
  }

  const field = (f: Field) => clsx(
    "w-full rounded-2xl bg-paper px-4 text-base text-ink outline-none ring-2 transition-shadow placeholder:text-ink-mute/70 focus:bg-white focus:ring-brand-500",
    errors[f] ? "ring-coral-400" : touched[f] && !errors[f] && v[f] ? "ring-mint-400" : "ring-transparent",
  );
  const label = "mb-2 block text-[15px] font-bold text-ink";
  const Err = ({ f }: { f: Field }) => errors[f] ? <p id={`cf-${f}-err`} className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-coral-600"><AlertCircle className="h-4 w-4" />{errors[f]}</p> : null;
  const aria = (f: Field) => ({ "aria-invalid": !!errors[f], "aria-describedby": errors[f] ? `cf-${f}-err` : undefined });

  return (
    <form ref={formRef} noValidate onSubmit={submit} className="grid gap-5 rounded-4xl bg-white p-6 shadow-card ring-1 ring-ink/5 md:p-8" aria-label="Contact form">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className={label}>Full name <span className="text-coral-600" aria-hidden>*</span></label>
          <input id="cf-name" autoComplete="name" required maxLength={80} value={v.name} onChange={(e) => set("name", e.target.value)} onBlur={() => blur("name")} className={clsx(field("name"), "h-14")} {...aria("name")} />
          <Err f="name" />
        </div>
        <div>
          <label htmlFor="cf-email" className={label}>Email <span className="text-coral-600" aria-hidden>*</span></label>
          <input id="cf-email" type="email" autoComplete="email" inputMode="email" required maxLength={160} value={v.email} onChange={(e) => set("email", e.target.value)} onBlur={() => blur("email")} className={clsx(field("email"), "h-14")} {...aria("email")} />
          <Err f="email" />
        </div>
        <div>
          <label htmlFor="cf-phone" className={label}>Phone <span className="font-semibold text-ink-mute">(optional)</span></label>
          <input id="cf-phone" type="tel" autoComplete="tel" inputMode="tel" maxLength={20} value={v.phone} onChange={(e) => set("phone", e.target.value)} onBlur={() => blur("phone")} className={clsx(field("phone"), "h-14")} {...aria("phone")} />
          <Err f="phone" />
        </div>
        <div>
          <label htmlFor="cf-subject" className={label}>Subject <span className="text-coral-600" aria-hidden>*</span></label>
          <select id="cf-subject" required value={v.subject} onChange={(e) => { set("subject", e.target.value); setTouched((t) => ({ ...t, subject: true })); setErrors((er) => ({ ...er, subject: undefined })); }} className={clsx(field("subject"), "h-14 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%230B1530%22 stroke-width=%222.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:20px] bg-[right_1rem_center] bg-no-repeat pr-12")} {...aria("subject")}>
            <option value="" disabled>Choose one…</option>
            {subjects.map((s) => <option key={s}>{s}</option>)}
          </select>
          <Err f="subject" />
        </div>
      </div>
      <div>
        <label htmlFor="cf-message" className={label}>Message <span className="text-coral-600" aria-hidden>*</span></label>
        <textarea id="cf-message" rows={6} required maxLength={2000} value={v.message} onChange={(e) => set("message", e.target.value)} onBlur={() => blur("message")} className={clsx(field("message"), "resize-y py-3.5")} {...aria("message")} />
        <div className="flex justify-between"><Err f="message" /><span className="ml-auto mt-1.5 text-sm text-ink-mute">{v.message.length}/2000</span></div>
      </div>
      {/* honeypot */}
      <div aria-hidden className="absolute -left-[9999px]"><label>Website<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label></div>

      {status === "error" && <p role="alert" className="flex items-center gap-2 rounded-2xl bg-coral-100 px-4 py-3 font-semibold text-coral-600"><AlertCircle className="h-5 w-5" />{msg}</p>}

      <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-mute">We use these details only to reply to you. <a href="/privacy/" className="font-semibold underline underline-offset-2">Privacy policy</a></p>
        <button type="submit" disabled={status === "sending"} className={buttonClass("primary", "lg")}>
          {status === "sending" ? <><Loader2 className="h-5 w-5 animate-spin" />Sending…</> : <><Send className="h-5 w-5" />Send message</>}
        </button>
      </div>
    </form>
  );
}
