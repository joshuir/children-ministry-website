"use client";

import { useRef, useState, type FormEvent, useEffect } from "react";
import clsx from "clsx";
import { gsap, useGSAP } from "@/lib/gsap";
import { celebrate, shake } from "./Motion";
import { Loader2, Lock } from "lucide-react";
import { buttonClass } from "./ui";
import { clean, markSent, spamCheck, submitRpc, validators, type FieldErrors } from "@/lib/forms";

type Field = "name" | "email";

/** A paper plane launches from the button and loops off the screen. */
function flyPlane(from: HTMLElement | null) {
  if (!from || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = from.getBoundingClientRect();
  const p = document.createElement("div");
  p.setAttribute("aria-hidden", "true");
  p.innerHTML = '<svg viewBox="0 0 24 24" width="44" height="44" fill="#FFC53D" stroke="#0B1530" stroke-width="1.6" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/></svg>';
  p.style.cssText = `position:fixed;left:${r.left + r.width / 2 - 22}px;top:${r.top + r.height / 2 - 22}px;z-index:120;pointer-events:none`;
  document.body.appendChild(p);
  gsap.timeline({ onComplete: () => p.remove() })
    .fromTo(p, { scale: 0.3, rotate: -20 }, { scale: 1.2, rotate: 0, duration: 0.25, ease: "back.out(3)" })
    .to(p, { keyframes: [{ x: -60, y: -90, rotate: -40, duration: 0.35, ease: "sine.out" }, { x: 120, y: -200, rotate: 30, duration: 0.35 }, { x: innerWidth, y: -innerHeight * 0.6, rotate: 50, scale: 0.6, duration: 0.6, ease: "power2.in" }] });
}

const EMOJI = ["💌", "🎉", "🙏", "💙", "✨", "📖"];

export function Newsletter({ variant = "card", thanks, button = "Subscribe" }: { variant?: "card" | "inline"; thanks?: string; button?: string }) {
  const opened = useRef(Date.now());
  const [values, setValues] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState<FieldErrors<Field>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);
  const [nudge, setNudge] = useState(0);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [count, setCount] = useState<number | null>(null);
  const [existing, setExisting] = useState(false);
  useGSAP(() => {
    if (status === "error") shake(formRef.current);
    if (status !== "done" || !doneRef.current) return;
    const el = doneRef.current;
    celebrate(el);
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const q = gsap.utils.selector(el);
    gsap.timeline({ delay: 0.15 })
      .from(q("[data-env]"), { y: 40, scale: 0.4, rotate: -20, duration: 0.6, ease: "back.out(2.2)" })
      .to(q("[data-flap]"), { rotateX: 180, duration: 0.45, ease: "power2.inOut", transformOrigin: "50% 0%" })
      .fromTo(q("[data-heart]"), { y: 10, scale: 0 }, { y: -26, scale: 1, duration: 0.5, ease: "back.out(3)" }, "-=0.1")
      .to(q("[data-heart]"), { scale: 1.15, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut" })
      .from(q("[data-done-line]"), { y: 14, autoAlpha: 0, stagger: 0.08, duration: 0.45, ease: "power3.out" }, 0.35);
    // emoji reactions float up like a live stream
    q("[data-emoji]").forEach((e, i) => gsap.fromTo(e, { y: 0, x: 0, autoAlpha: 0, scale: 0.4 }, { y: gsap.utils.random(-140, -220), x: gsap.utils.random(-50, 50), autoAlpha: 1, scale: gsap.utils.random(0.9, 1.4), duration: 1.6, delay: 0.5 + i * 0.12, ease: "power1.out", onComplete: () => { gsap.to(e, { autoAlpha: 0, duration: 0.4 }); } }));
  }, { dependencies: [status] });
  useEffect(() => { if (nudge) shake(formRef.current); }, [nudge]);
  const [message, setMessage] = useState("");

  const validate = (v = values) => ({ name: validators.required(v.name, "name"), email: validators.email(v.email) });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (errs.name || errs.email) {
      (e.currentTarget.querySelector("[aria-invalid=true]") as HTMLElement | null)?.focus();
      setNudge((n) => n + 1);
      return;
    }
    const spam = spamCheck(e.currentTarget, opened.current, "newsletter");
    if (spam === "spam") { setStatus("done"); return; }
    if (spam) { setStatus("error"); setMessage(spam); return; }
    setStatus("sending");
    const res = await submitRpc("subscribe_newsletter", { p_name: clean(values.name, 80), p_email: clean(values.email, 160).toLowerCase() });
    if (res.ok) {
      markSent("newsletter");
      const d = (res as { data?: Record<string, unknown> }).data || {};
      if (typeof d.count === "number") setCount(d.count);
      setExisting(!!d.existing);
      flyPlane(btnRef.current);
      setTimeout(() => setStatus("done"), 380);
    }
    else { setStatus("error"); setMessage(res.message); }
  }

  const dark = variant === "card";

  if (status === "done") {
    const first = values.name.split(" ")[0] || "friend";
    return (
      <div ref={doneRef} role="status" className={clsx("relative flex items-center gap-5 overflow-visible rounded-3xl p-5 sm:p-6", dark ? "bg-white text-ink" : "bg-mint-100 text-ink")}>
        <div className="relative shrink-0" aria-hidden>
          <svg data-env viewBox="0 0 64 48" className="h-16 w-20 overflow-visible" style={{ perspective: 200 }}>
            <rect x="2" y="8" width="60" height="38" rx="6" fill="#2563EB" />
            <path d="M2 44 26 26M62 44 38 26" stroke="#173EA8" strokeWidth="3" />
            <g data-heart><path d="M32 22c-6-6-14-1-10 6l10 9 10-9c4-7-4-12-10-6z" fill="#FF7A59" stroke="#0B1530" strokeWidth="1.5" /></g>
            <path data-flap d="M4 10 32 30 60 10" fill="#5B8CFF" stroke="#173EA8" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          {EMOJI.map((e, i) => <span key={i} data-emoji className="pointer-events-none absolute left-1/2 top-0 text-2xl opacity-0">{e}</span>)}
        </div>
        <div className="min-w-0">
          <p data-done-line className="font-display text-2xl font-extrabold leading-tight">{existing ? `Welcome back, ${first}!` : `You're in, ${first}!`}</p>
          <p data-done-line className="mt-1 font-semibold text-ink-soft">{existing ? "You're already on our list — nothing more to do." : thanks || "Look out for our next family update."}</p>
          {count && !existing ? <p data-done-line className="mt-2 inline-flex rounded-full bg-sun-400 px-3 py-1 text-sm font-extrabold text-ink">Family #{count} on the list 🎉</p> : null}
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} aria-label="Newsletter sign-up">
      <div className="grid gap-3 sm:grid-cols-[1fr_1.3fr_auto]">
        {(["name", "email"] as Field[]).map((f) => (
          <div key={f}>
            <label htmlFor={`nl-${f}-${variant}`} className="sr-only">{f === "name" ? "Your name" : "Email address"}</label>
            <input
              id={`nl-${f}-${variant}`}
              name={f}
              type={f === "email" ? "email" : "text"}
              autoComplete={f === "email" ? "email" : "given-name"}
              placeholder={f === "name" ? "Your name" : "Email address"}
              value={values[f]}
              maxLength={f === "email" ? 160 : 80}
              aria-invalid={!!errors[f]}
              aria-describedby={errors[f] ? `nl-${f}-err-${variant}` : undefined}
              onChange={(e) => { const v = { ...values, [f]: e.target.value }; setValues(v); if (errors[f]) setErrors({ ...errors, [f]: validate(v)[f] }); }}
              className={clsx(
                "h-14 w-full rounded-full px-5 text-base outline-none transition-shadow focus:ring-[3px]",
                dark ? "bg-white text-ink placeholder:text-ink-mute focus:ring-sun-400" : "bg-white text-ink ring-2 ring-ink/10 placeholder:text-ink-mute focus:ring-brand-500",
                errors[f] && "ring-[3px] ring-coral-400",
              )}
            />
            {errors[f] && <p id={`nl-${f}-err-${variant}`} className={clsx("mt-1.5 px-4 text-sm font-semibold", dark ? "text-coral-100" : "text-coral-600")}>{errors[f]}</p>}
          </div>
        ))}
        {/* honeypot */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <button ref={btnRef} type="submit" disabled={status === "sending"} className={clsx(buttonClass(dark ? "sun" : "primary", "lg"), "h-14")}>
          {status === "sending" ? <><Loader2 className="h-5 w-5 animate-spin" /> Subscribing…</> : button}
        </button>
      </div>
      {status === "error" && <p role="alert" className={clsx("mt-3 px-2 text-sm font-semibold", dark ? "text-coral-100" : "text-coral-600")}>{message}</p>}
      <p className={clsx("mt-4 flex items-start gap-2 px-1 text-sm leading-relaxed", dark ? "text-white/70" : "text-ink-mute")}>
        <Lock className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Monthly family updates only. We never share your details. <a href="/privacy/" className="underline underline-offset-2">Privacy</a></span>
      </p>
    </form>
  );
}
